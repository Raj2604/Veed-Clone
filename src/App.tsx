import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Scissors,
  Type,
  Image,
  Upload,
  Download,
  Share2,
  Settings,
  ChevronDown,
  Plus,
  Search,
  Clock,
  Music,
  Video,
  Mic,
  Camera,
  Palette,
  Filter,
  Wand2,
  Layers,
  ArrowLeft,
  ArrowRight,
  SkipBack,
  SkipForward,
  Maximize2,
  Monitor,
  Zap,
  GripHorizontal,
  X,
  Menu,
  MessageSquare,
  HelpCircle,
  Check,
  Cloud,
  CloudOff,
  ArrowUp,
  Minus,
} from 'lucide-react';
import 'react-resizable/css/styles.css';

interface MediaElement {
  id: string;
  type: 'image' | 'video';
  src: string;
  filename: string;
  width: number;
  height: number;
  position: { x: number; y: number };
  startTime: number;
  endTime: number;
  muted: boolean;
}

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [mediaElements, setMediaElements] = useState<MediaElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<MediaElement | null>(null);
  const [maxTime, setMaxTime] = useState(60);
  const [globalMute, setGlobalMute] = useState(false);
  const [volume, setVolume] = useState(100);
  const [zoom, setZoom] = useState(100);
  const [projectName, setProjectName] = useState('Project Name');
  const [draggingTimeline, setDraggingTimeline] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const timerRef = useRef<number>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mediaElements.length === 0) {
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [mediaElements]);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = window.setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 0.1;
          
          const hasActiveMedia = mediaElements.some(
            el => next >= el.startTime && next <= el.endTime
          );

          if (!hasActiveMedia || next >= maxTime) {
            setIsPlaying(false);
            clearInterval(timerRef.current);
            return prev;
          }

          return Number(next.toFixed(1));
        });
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPlaying, mediaElements, maxTime]);

  useEffect(() => {
    mediaElements.forEach(element => {
      if (element.type === 'video') {
        const video = document.querySelector(`video[data-id="${element.id}"]`) as HTMLVideoElement;
        if (video) {
          if (currentTime < element.startTime || currentTime >= element.endTime) {
            video.style.display = 'none';
            video.pause();
            if (currentTime < element.startTime) {
              video.currentTime = 0;
            }
          } else {
            video.style.display = 'block';
            const videoTime = currentTime - element.startTime;
            
            if (Math.abs(video.currentTime - videoTime) > 0.1) {
              video.currentTime = videoTime;
            }

            if (isPlaying) {
              if (video.readyState >= 2) {
                const playPromise = video.play();
                if (playPromise !== undefined) {
                  playPromise.catch(() => {});
                }
              } else {
                video.addEventListener('loadeddata', function playWhenLoaded() {
                  if (isPlaying && currentTime >= element.startTime && currentTime < element.endTime) {
                    const playPromise = video.play();
                    if (playPromise !== undefined) {
                      playPromise.catch(() => {});
                    }
                  }
                  video.removeEventListener('loadeddata', playWhenLoaded);
                });
              }
            } else {
              video.pause();
            }
          }
        }
      }
    });
  }, [currentTime, isPlaying, mediaElements]);

  const calculateInitialPosition = () => {
    if (!previewRef.current) return { x: 0, y: 0 };
    
    const previewRect = previewRef.current.getBoundingClientRect();
    return {
      x: (previewRect.width - 320) / 2,
      y: (previewRect.height - 240) / 2
    };
  };

  const handleUploadAreaDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleUploadAreaDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (
      x <= rect.left ||
      x >= rect.right ||
      y <= rect.top ||
      y >= rect.bottom
    ) {
      setIsDragging(false);
    }
  };

  const handleUploadAreaDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleUploadAreaDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const mediaFile = files.find(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    
    if (!mediaFile) {
      alert('Please drop an image or video file');
      return;
    }
    
    handleFileUpload(mediaFile);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      if (!e.target?.result) return;
      
      const img = new window.Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        let width = 320;
        let height = width / aspectRatio;
        
        if (height > 240) {
          height = 240;
          width = height * aspectRatio;
        }

        const initialPosition = calculateInitialPosition();
        const newElement: MediaElement = {
          id: Math.random().toString(36).substr(2, 9),
          type: file.type.startsWith('image/') ? 'image' : 'video',
          src: e.target!.result as string,
          filename: file.name,
          width: Math.round(width),
          height: Math.round(height),
          position: {
            x: initialPosition.x - (width - 320) / 2,
            y: initialPosition.y - (height - 240) / 2
          },
          startTime: 0,
          endTime: 10,
          muted: false,
        };
        setMediaElements((prev) => [...prev, newElement]);
        setSelectedElement(newElement);
      };
      img.src = e.target.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    handleFileUpload(files[0]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.dataTransfer.types.includes('Files')) {
      return;
    }
    
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const mediaFile = files.find(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    
    if (!mediaFile) {
      alert('Please drop an image or video file');
      return;
    }
    
    handleFileUpload(mediaFile);
  };

  const updateElementProperty = (id: string, property: keyof MediaElement, value: any) => {
    setMediaElements((prev) =>
      prev.map((element) => {
        if (element.id === id) {
          if (property === 'startTime' && value >= element.endTime) {
            return { ...element, startTime: value, endTime: value + 1 };
          }
          if (property === 'endTime' && value <= element.startTime) {
            return { ...element, endTime: element.startTime + 1 };
          }
          return { ...element, [property]: value };
        }
        return element;
      })
    );
    if (selectedElement?.id === id) {
      setSelectedElement((prev) => {
        if (!prev) return null;
        if (property === 'startTime' && value >= prev.endTime) {
          return { ...prev, startTime: value, endTime: value + 1 };
        }
        if (property === 'endTime' && value <= prev.startTime) {
          return { ...prev, endTime: prev.startTime + 1 };
        }
        return { ...prev, [property]: value };
      });
    }
  };

  const handleDrag = (id: string, e: any, data: { x: number; y: number }) => {
    updateElementProperty(id, 'position', { x: data.x, y: data.y });
  };

  const handleResize = (id: string, e: any, { size }: { size: { width: number; height: number } }) => {
    updateElementProperty(id, 'width', size.width);
    updateElementProperty(id, 'height', size.height);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const decimal = Math.floor((time % 1) * 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${decimal}`;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentage = clickPosition / rect.width;
    const newTime = Number((percentage * maxTime).toFixed(1));
    setCurrentTime(Math.min(Math.max(0, newTime), maxTime));
  };

  const handleTimelineTrackClick = (startTime: number) => {
    setCurrentTime(startTime);
    setIsPlaying(false);
  };

  const handleTimelineDragStart = (e: React.MouseEvent, id: string, type: 'start' | 'end') => {
    e.stopPropagation();
    setDraggingTimeline(`${id}-${type}`);
  };

  const handleTimelineDragMove = (e: React.MouseEvent) => {
    if (!draggingTimeline || !timelineRef.current) return;

    const [id, type] = draggingTimeline.split('-');
    const rect = timelineRef.current.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    const newTime = Math.max(0, Math.min(maxTime, Number((percentage * maxTime).toFixed(1))));

    const element = mediaElements.find(el => el.id === id);
    if (!element) return;

    if (type === 'start' && newTime < element.endTime) {
      updateElementProperty(id, 'startTime', newTime);
    } else if (type === 'end' && newTime > element.startTime) {
      updateElementProperty(id, 'endTime', newTime);
    }
  };

  const handleTimelineDragEnd = () => {
    setDraggingTimeline(null);
  };

  const isMediaVisible = (element: MediaElement) => {
    return currentTime >= element.startTime && currentTime < element.endTime;
  };

  useEffect(() => {
    if (draggingTimeline) {
      const handleMouseUp = () => setDraggingTimeline(null);
      const handleMouseMove = (e: MouseEvent) => {
        handleTimelineDragMove(e as unknown as React.MouseEvent);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingTimeline]);

  const parseTimeInput = (timeStr: string): number | null => {
    // Match format MM:SS.D
    const match = timeStr.match(/^(\d{2}):(\d{2})\.(\d)$/);
    if (!match) return null;
    
    const [_, minutes, seconds, decimal] = match;
    const totalSeconds = parseInt(minutes) * 60 + parseInt(seconds) + parseInt(decimal) * 0.1;
    return Number(totalSeconds.toFixed(1));
  };

  const handlePlayPause = () => {
    if (!isPlaying) {
      // When starting playback, set current time to the earliest start time of visible media
      const visibleMedia = mediaElements.filter(el => currentTime >= el.startTime && currentTime <= el.endTime);
      if (visibleMedia.length > 0) {
        const earliestStart = Math.min(...visibleMedia.map(el => el.startTime));
        setCurrentTime(earliestStart);
      } else {
        // If no visible media, find the next media to play
        const nextMedia = mediaElements.find(el => el.startTime > currentTime);
        if (nextMedia) {
          setCurrentTime(nextMedia.startTime);
        }
      }
    }
    setIsPlaying(!isPlaying);
  };

  const getTimelineLabels = () => {
    return ['0s', '10s', '20s', '30s', '40s', '50s', '60s'];
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-gray-800 flex flex-col">
      {/* Top Navigation */}
      <nav className="bg-white px-4 h-14 flex justify-between items-center border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-medium">
            {mediaElements.length > 0 ? mediaElements[mediaElements.length - 1].filename : 'Project Name'}
          </h1>
        </div>
        <div className="flex items-center space-x-6">
          <button className="text-gray-600 hover:text-gray-800 flex items-center gap-2">
            <CloudOff className="w-4 h-4" />
            <span>Log in to save progress</span>
          </button>
          <div className="flex items-center gap-1">
            <button disabled aria-label="undo" className="p-2 text-gray-400 disabled:opacity-40">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="m8 8-4 4 4 4" />
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M19 16a4 4 0 0 0-4-4H4" />
              </svg>
            </button>
            <button disabled aria-label="redo" className="p-2 text-gray-400 disabled:opacity-40">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="m16 8 4 4-4 4" />
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M5 16a4 4 0 0 1 4-4h11" />
              </svg>
            </button>
          </div>
          {/* Vertical divider */}
          <div className="h-4 w-[1px] bg-gray-200"></div>
          <div className="flex items-center space-x-3">
            <button className="text-sm text-[#6366f1] hover:text-[#4f46e5] px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors underline">
            Sign Up
          </button>
            <span>·</span>
            <button className="text-sm text-[#6366f1] hover:text-[#4f46e5] px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors underline">
            Log In
          </button>
          </div>
          <button className="bg-[#f97316] hover:bg-[#ea580c] text-white font-medium text-sm px-4 py-1.5 rounded-lg transition-colors flex items-center space-x-1">
            <span>Upgrade</span>
            <Zap className="w-4 h-4 text-white" />
          </button>
          <button className="bg-black hover:bg-gray-800 text-white font-medium text-sm px-4 py-1.5 rounded-lg transition-colors flex items-center space-x-1">
            <span>Done</span>
            <Check className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Content Area */}
      <div className="flex flex-1">
        {/* Left Sidebar */}
          <div className="w-[380px] bg-white border-r border-gray-200">
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
                {mediaElements.length === 0 ? (
                  <>
                    <h2 className="text-lg font-medium mb-4">Add Media</h2>
                    <div 
                      className={`bg-white rounded-lg border-2 border-dashed ${isDragging ? 'border-[#6366f1] bg-[#6366f1]/5' : 'border-gray-200'} p-6 mb-4 transition-colors cursor-pointer`}
                      onDragEnter={handleUploadAreaDragEnter}
                      onDragLeave={handleUploadAreaDragLeave}
                      onDragOver={handleUploadAreaDragOver}
                      onDrop={handleUploadAreaDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="relative mb-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 16 16" className="text-gray-400" style={{ strokeWidth: '1.2px' }}>
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M5 13.5h-.005a4.001 4.001 0 1 1 .13-7.998 4.002 4.002 0 1 1 7.716 2.117A3.001 3.001 0 0 1 12 13.5h-1M8 8l-2.5 2.5M8 8l2.5 2.5M8 8v5.6" />
                          </svg>
                        </div>
                        <h3 className="text-base font-medium mb-1">Upload a File</h3>
                        <p className="text-sm text-gray-500 mb-2">Drag & drop a file</p>
                        <p className="text-sm text-gray-500">or <span className="text-[#6366f1] hover:text-[#4f46e5]">import from a link</span></p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button className="flex items-center space-x-2 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 16 16" className="text-gray-600" style={{ strokeWidth: '1.33333px' }}>
                          <path stroke="currentColor" strokeLinecap="round" d="m11.182 6.437 2.861-1.639c.424-.243.957.058.957.54v5.324c0 .482-.533.783-.957.54l-2.861-1.64M2.909 13h6.364c1.054 0 1.909-.84 1.909-1.875v-6.25c0-1.036-.855-1.875-1.91-1.875H2.91C1.855 3 1 3.84 1 4.875v6.25C1 12.161 1.855 13 2.91 13Z" />
                        </svg>
                        <span className="text-sm">Record</span>
                      </button>
                      <button className="flex items-center space-x-2 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 16 16" className="text-gray-600" style={{ strokeWidth: '1.33333px' }}>
                          <g clipPath="url(#a)">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M4.111 15c.825 0 1.617-.328 2.2-.911m-2.2.911A3.11 3.11 0 0 1 1 11.889v0V2.5A1.5 1.5 0 0 1 2.5 1h3.222a1.5 1.5 0 0 1 1.5 1.5v9.389c0 .825-.328 1.616-.911 2.2m-2.2.911H13.5a1.5 1.5 0 0 0 1.5-1.5v-3.222a1.5 1.5 0 0 0-1.5-1.5h-1.878m-5.311 5.31 6.6-6.599a1.556 1.556 0 0 0 0-2.2l-2.2-2.2a1.556 1.556 0 0 0-2.2 0L7.222 4.378" />
                            <circle cx="4.1" cy="11.8" r="1" fill="currentColor" />
                          </g>
                          <defs>
                            <clipPath id="a">
                              <path fill="#fff" d="M0 0h16v16H0z" />
                            </clipPath>
                          </defs>
                        </svg>
                        <span className="text-sm">Brand Kits</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <button className="flex items-center space-x-2 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 16 16" className="text-gray-600" style={{ strokeWidth: '1.33333px' }}>
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M5.333 6.667h5.334M5.333 9.333h4m4.4 2.068a6.666 6.666 0 1 0-2.332 2.333l2.304.658a.557.557 0 0 0 .687-.687z" />
                        </svg>
                        <span className="text-sm">Text to Speech</span>
                      </button>
                      <button className="flex items-center space-x-2 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 16 16" className="text-gray-600" style={{ strokeWidth: '1.33333px' }}>
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M14.667 8H13.44a2 2 0 0 0-1.897 1.368L10 14 6 2 4.456 6.632A2 2 0 0 1 2.558 8H1.333" />
                        </svg>
                        <span className="text-sm">Voice Clone</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <h2 className="text-lg font-medium mb-4">Edit {selectedElement?.type === 'image' ? 'Image' : 'Video'}</h2>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <Clock className="w-5 h-5 text-gray-600" />
                          <span className="text-sm">Animations</span>
                        </button>
                        <button className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <Wand2 className="w-5 h-5 text-gray-600" />
                          <span className="text-sm">Adjust</span>
                        </button>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-600">
                            <path d="M4 12V8C4 5.79086 5.79086 4 8 4H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <path d="M20 12V8C20 5.79086 18.2091 4 16 4H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <path d="M20 12V16C20 18.2091 18.2091 20 16 20H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <path d="M4 12V16C4 18.2091 5.79086 20 8 20H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                          <span className="text-sm">Round Corners</span>
                        </div>
                        <div className="w-8 h-4 bg-gray-200 rounded-full relative">
                          <div className="absolute right-0 w-4 h-4 bg-white rounded-full shadow"></div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-2">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-600">
                            <path d="M12 4L12 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <path d="M4 12L20 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <circle cx="12" cy="12" r="2" fill="currentColor"/>
                          </svg>
                          <span className="text-sm">Opacity</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value="100"
                            className="w-24 h-1 bg-blue-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                          />
                          <span className="text-sm text-gray-600 min-w-[40px] text-right">100%</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1 flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-600">
                              <path d="M9 9L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              <path d="M15 9L9 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                              <path d="M3 12H6M18 12H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
                              <path d="M12 3V6M12 18V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
                            </svg>
                            <span className="text-sm">Rotation</span>
                          </div>
                          <span className="text-sm text-gray-600">0°</span>
                        </div>
                        <button className="flex items-center justify-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-600">
                            <path d="M12 8L12 12M12 12L12 16M12 12L16 12M12 12L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <path d="M3 12H6M18 12H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
                            <path d="M12 3V6M12 18V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
                          </svg>
                        </button>
                        <button className="flex items-center justify-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-600">
                            <path d="M12 8L12 12M12 12L12 16M12 12L16 12M12 12L8 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" transform="rotate(45, 12, 12)"/>
                            <path d="M3 12H6M18 12H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
                            <path d="M12 3V6M12 18V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
                          </svg>
                        </button>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-600">
                              <path d="M3 12H6M18 12H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
                              <path d="M12 3V6M12 18V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
                            </svg>
                            <span className="text-sm">Width</span>
                            <input
                              type="number"
                              min="1"
                              max="1920"
                              value={selectedElement?.width || 320}
                              onChange={(e) => {
                                if (selectedElement) {
                                  const newWidth = Math.max(1, Math.min(1920, parseInt(e.target.value) || 1));
                                  setMediaElements(prev => prev.map(el => 
                                    el.id === selectedElement.id ? { ...el, width: newWidth } : el
                                  ));
                                  setSelectedElement(prev => prev ? { ...prev, width: newWidth } : null);
                                }
                              }}
                              className="text-sm text-gray-600 w-16 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-600">
                              <path d="M12 3V6M12 18V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
                              <path d="M3 12H6M18 12H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2"/>
                            </svg>
                            <span className="text-sm">Height</span>
                            <input
                              type="number"
                              min="1"
                              max="1080"
                              value={selectedElement?.height || 240}
                              onChange={(e) => {
                                if (selectedElement) {
                                  const newHeight = Math.max(1, Math.min(1080, parseInt(e.target.value) || 1));
                                  setMediaElements(prev => prev.map(el => 
                                    el.id === selectedElement.id ? { ...el, height: newHeight } : el
                                  ));
                                  setSelectedElement(prev => prev ? { ...prev, height: newHeight } : null);
                                }
                              }}
                              className="text-sm text-gray-600 w-16 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-gray-600" />
                            <span className="text-sm">Start</span>
                            <input
                              type="text"
                              defaultValue={selectedElement ? formatTime(selectedElement.startTime) : "00:00.0"}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const timeValue = parseTimeInput(e.currentTarget.value);
                                  if (timeValue !== null && selectedElement) {
                                    const newStartTime = Math.max(0, Math.min(timeValue, selectedElement.endTime - 0.1));
                                    setMediaElements(prev => prev.map(el => 
                                      el.id === selectedElement.id ? { ...el, startTime: newStartTime } : el
                                    ));
                                    setSelectedElement(prev => prev ? { ...prev, startTime: newStartTime } : null);
                                  } else {
                                    e.currentTarget.value = selectedElement ? formatTime(selectedElement.startTime) : "00:00.0";
                                  }
                                  e.currentTarget.blur();
                                }
                              }}
                              onBlur={(e) => {
                                if (!selectedElement) return;
                                const timeValue = parseTimeInput(e.target.value);
                                if (timeValue !== null) {
                                  const newStartTime = Math.max(0, Math.min(timeValue, selectedElement.endTime - 0.1));
                                  setMediaElements(prev => prev.map(el => 
                                    el.id === selectedElement.id ? { ...el, startTime: newStartTime } : el
                                  ));
                                  setSelectedElement(prev => prev ? { ...prev, startTime: newStartTime } : null);
                                } else {
                                  e.target.value = formatTime(selectedElement.startTime);
                                }
                              }}
                              className="text-sm text-gray-600 w-16 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-gray-600" />
                            <span className="text-sm">End</span>
                            <input
                              type="text"
                              defaultValue={selectedElement ? formatTime(selectedElement.endTime) : "00:05.0"}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const timeValue = parseTimeInput(e.currentTarget.value);
                                  if (timeValue !== null && selectedElement) {
                                    const newEndTime = Math.max(selectedElement.startTime + 0.1, Math.min(timeValue, maxTime));
                                    setMediaElements(prev => prev.map(el => 
                                      el.id === selectedElement.id ? { ...el, endTime: newEndTime } : el
                                    ));
                                    setSelectedElement(prev => prev ? { ...prev, endTime: newEndTime } : null);
                                  } else {
                                    e.currentTarget.value = selectedElement ? formatTime(selectedElement.endTime) : "00:05.0";
                                  }
                                  e.currentTarget.blur();
                                }
                              }}
                              onBlur={(e) => {
                                if (!selectedElement) return;
                                const timeValue = parseTimeInput(e.target.value);
                                if (timeValue !== null) {
                                  const newEndTime = Math.max(selectedElement.startTime + 0.1, Math.min(timeValue, maxTime));
                                  setMediaElements(prev => prev.map(el => 
                                    el.id === selectedElement.id ? { ...el, endTime: newEndTime } : el
                                  ));
                                  setSelectedElement(prev => prev ? { ...prev, endTime: newEndTime } : null);
                                } else {
                                  e.target.value = formatTime(selectedElement.endTime);
                                }
                              }}
                              className="text-sm text-gray-600 w-16 bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-8">
                      <h3 className="text-base font-medium mb-2">Media</h3>
                      <button className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-2">
                          <Upload className="w-5 h-5 text-gray-600" />
                          <span className="text-sm">Replace Image</span>
                        </div>
                        <Upload className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>

          {/* Preview Area */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 bg-[#f8f9fb] p-8">
              <div 
                className="w-full h-full flex items-center justify-center bg-[#f8f9fb] rounded-lg"
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div 
                  ref={previewRef}
                  className="relative w-[60%] h-[80%] aspect-video bg-black overflow-hidden rounded-lg"
                >
                  {mediaElements.map((element) => (
                    isMediaVisible(element) && (
                      <Draggable
                        key={element.id}
                        position={element.position}
                        onDrag={(e, data) => handleDrag(element.id, e, data)}
                        onMouseDown={() => setSelectedElement(element)}
                        bounds="parent"
                      >
                        <ResizableBox
                          width={element.width}
                          height={element.height}
                          onResize={(e, data) => handleResize(element.id, e, data)}
                          draggableOpts={{ grid: [1, 1] }}
                        >
                          {element.type === 'image' ? (
                            <img
                              src={element.src}
                              alt=""
                              className="w-full h-full object-cover"
                                style={{ display: isMediaVisible(element) ? 'block' : 'none' }}
                            />
                          ) : (
                            <video
                                data-id={element.id}
                              src={element.src}
                              className="w-full h-full object-cover"
                              muted={element.muted || globalMute}
                                playsInline
                                style={{ display: 'none' }}
                            />
                          )}
                        </ResizableBox>
                      </Draggable>
                    )
                  ))}
                  {mediaElements.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileInputChange}
                          accept="image/*,video/*"
                          className="hidden"
                        />
                      </div>
                    </div>
                  )}
                  {isDragging && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="text-white text-lg flex items-center gap-2">
                        <Upload className="w-6 h-6" />
                        Drop your media here
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Controls */}
            <div className="flex items-center justify-center gap-2 px-4 py-3 bg-[#f8f9fb]">
              <button className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                <Monitor className="w-4 h-4 text-gray-600" />
                <span className="text-sm">Landscape (16:9)</span>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>
              <button className="flex items-center space-x-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="w-3 h-3 rounded-full bg-black"></div>
                <span className="text-sm">Background</span>
              </button>
            </div>
          </div>
        </div>

        {/* Timeline - Full Width */}
          <div className="bg-white border-t border-gray-200">
          <div className="flex items-center px-4 py-2 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              {/* Split and Voiceover buttons */}
              <button className="flex items-center space-x-2 text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-lg">
                <Scissors className="w-4 h-4" />
                <span className="text-sm">Split</span>
              </button>
              <button className="flex items-center space-x-2 text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-lg">
                <Mic className="w-4 h-4" />
                <span className="text-sm">Voiceover</span>
              </button>
            </div>

            {/* Playback Controls and Timeline */}
            <div className="flex-1 flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-2">
                <button className="hover:bg-gray-100 p-2 rounded-lg transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-600">
                    <path d="M11 7L4 12L11 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M20 7L13 12L20 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  onClick={handlePlayPause}
                  className="hover:bg-gray-100 p-2 rounded-lg transition-colors"
                >
                  {isPlaying ? <Pause className="w-4 h-4 text-gray-600" /> : <Play className="w-4 h-4 text-gray-600" />}
                </button>
                <button className="hover:bg-gray-100 p-2 rounded-lg transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-600">
                    <path d="M13 17L20 12L13 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M4 17L11 12L4 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              <div className="text-sm text-gray-600">
                {formatTime(currentTime)} / {formatTime(maxTime)}
              </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center space-x-3">
              <button className="hover:bg-gray-100 p-2 rounded-lg transition-colors relative">
                <Search className="w-4 h-4 text-gray-600" />
                <Minus className="w-2 h-2 text-gray-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </button>
              <div className="w-32">
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={zoom}
                  onChange={(e) => setZoom(parseInt(e.target.value))}
                  className="w-full h-1 bg-blue-200 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
                />
              </div>
              <button className="hover:bg-gray-100 p-2 rounded-lg transition-colors relative">
                <Search className="w-4 h-4 text-gray-600" />
                <Plus className="w-2 h-2 text-gray-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </button>
              <button className="hover:bg-gray-100 px-3 py-1.5 rounded-lg text-sm text-gray-700">
                Fit
                  </button>
              {/* Vertical divider */}
              <div className="h-4 w-[1px] bg-gray-200"></div>
                    <button className="hover:bg-gray-100 p-2 rounded-lg transition-colors">
                      <Settings className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>

          {/* Timeline */}
          <div className="p-0">
            <div className="h-[120px] bg-[#f8f9fb] p-3">
              <div className="flex justify-between text-xs text-gray-500 mb-2 px-2">
                {getTimelineLabels().map((label, index) => (
                  <span key={index}>{label}</span>
                ))}
              </div>
                <div 
                  ref={timelineRef}
                className="relative h-[calc(100%-24px)] border border-gray-200 bg-white"
                  onClick={handleTimelineClick}
                >
                  {mediaElements.map((element) => (
                    <div
                      key={element.id}
                      className={`absolute h-12 bg-[#f8f9fb] border border-gray-200 rounded-lg text-sm cursor-move ${
                        selectedElement?.id === element.id ? 'ring-2 ring-[#6366f1]' : ''
                      }`}
                      style={{
                        left: `${(element.startTime / maxTime) * 100}%`,
                        width: `${((element.endTime - element.startTime) / maxTime) * 100}%`,
                        top: '50%',
                        transform: 'translateY(-50%)'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElement(element);
                        handleTimelineTrackClick(element.startTime);
                      }}
                    >
                      <div className="flex items-center justify-between h-full px-2">
                        <div
                          className="absolute left-0 w-2 h-full cursor-ew-resize flex items-center justify-center hover:bg-[#6366f1] rounded-l-lg transition-colors"
                          onMouseDown={(e) => handleTimelineDragStart(e, element.id, 'start')}
                        >
                          <GripHorizontal className="w-3 h-3" />
                        </div>
                        <span className="mx-4 truncate">{element.filename}</span>
                        <div
                          className="absolute right-0 w-2 h-full cursor-ew-resize flex items-center justify-center hover:bg-[#6366f1] rounded-r-lg transition-colors"
                          onMouseDown={(e) => handleTimelineDragStart(e, element.id, 'end')}
                        >
                          <GripHorizontal className="w-3 h-3" />
                        </div>
                      </div>
                    </div>
                  ))}
                  {mediaElements.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[#6366f1] hover:text-[#4f46e5] text-sm"
                      >
                        + Add media to this project
                      </button>
                    </div>
                  )}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-[#6366f1]"
                    style={{ left: `${(currentTime / maxTime) * 100}%` }}
                  />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;