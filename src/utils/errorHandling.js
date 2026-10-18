import { WifiOff, MapPinOff, ServerCrash, AlertCircle, Lock, VolumeX } from 'lucide-react';

export function parseError(err, context = 'content') {
  const errStr = (err?.message || err?.toString() || '').toLowerCase();
  
  // Log real technical error in console safely for debugging
  console.warn(`[Diagnostics - ${context}]:`, err);
  
  if (errStr.includes('abort') || err?.name === 'AbortError') {
    return {
      title: 'Request Cancelled',
      message: `The request for ${context} was cancelled.`,
      icon: AlertCircle,
      type: 'abort',
      isAbort: true
    };
  }

  if (
    !navigator.onLine || 
    errStr.includes('failed to fetch') || 
    errStr.includes('network error') || 
    errStr.includes('networkerror') || 
    errStr.includes('internet') || 
    errStr.includes('timeout') ||
    errStr.includes('econnrefused')
  ) {
    return {
      title: 'Connection Offline',
      message: `Your internet connection seems to be offline or unstable. Please check your connection to load ${context}.`,
      icon: WifiOff,
      type: 'network'
    };
  }

  if (
    errStr.includes('location') || 
    errStr.includes('geolocation') || 
    errStr.includes('permission denied') ||
    errStr.includes('position unavailable')
  ) {
    return {
      title: 'Location Unavailable',
      message: `We couldn't access your location for ${context}. Please grant location permission or select your area manually.`,
      icon: MapPinOff,
      type: 'location'
    };
  }

  if (
    errStr.includes('audio') || 
    errStr.includes('media') || 
    errStr.includes('not supported') ||
    errStr.includes('play()') ||
    errStr.includes('decode')
  ) {
    return {
      title: 'Audio Unavailable',
      message: `Audio recitation could not be played right now. Please check your connection and try again.`,
      icon: VolumeX,
      type: 'audio'
    };
  }

  if (errStr.includes('429') || errStr.includes('quota') || errStr.includes('rate limit') || errStr.includes('busy')) {
    return {
      title: 'Service Busy',
      message: `The ${context} service is currently handling high traffic. Please wait a moment and try again.`,
      icon: ServerCrash,
      type: 'rate_limit'
    };
  }

  if (errStr.includes('500') || errStr.includes('502') || errStr.includes('503') || errStr.includes('504') || errStr.includes('unavailable')) {
    return {
      title: 'Service Temporarily Unavailable',
      message: `The ${context} service is temporarily unavailable. Please try again in a moment.`,
      icon: ServerCrash,
      type: 'server'
    };
  }
  
  if (errStr.includes('401') || errStr.includes('403') || errStr.includes('unauthorized') || errStr.includes('forbidden')) {
    return {
      title: 'Access Unavailable',
      message: `Unable to access ${context} at this moment.`,
      icon: Lock,
      type: 'auth'
    };
  }

  return {
    title: 'Content Unavailable',
    message: `Unable to load ${context} right now. Please try again.`,
    icon: AlertCircle,
    type: 'unknown'
  };
}

export function getFriendlyAudioErrorMessage(err) {
  if (err?.name === 'AbortError') return '';
  const str = (err?.message || err?.toString() || '').toLowerCase();
  console.warn('[Diagnostics - Audio]:', err);

  if (!navigator.onLine || str.includes('failed to fetch') || str.includes('network')) {
    return 'Please check your internet connection and try again.';
  }
  if (str.includes('not supported') || str.includes('decode') || str.includes('format')) {
    return 'Audio recitation format could not be played on this device.';
  }
  return 'Audio recitation could not be played right now. Please try again.';
}

