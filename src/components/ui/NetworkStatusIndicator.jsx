// ============================================
// NETWORK STATUS INDICATOR
// Subtle, non-intrusive floating indicator
// Shows offline status, reconnection state, and brief back-online confirmation
// ============================================

import { WifiOff, Check, Loader2 } from 'lucide-react';
import { useNetwork } from '../../context/NetworkContext';
import './NetworkStatusIndicator.css';

export default function NetworkStatusIndicator() {
  const { isOffline, isReconnecting, wasOfflineRecently, manualRefresh } = useNetwork();

  // If online and no recent recovery, render nothing (zero clutter)
  if (!isOffline && !isReconnecting && !wasOfflineRecently) {
    return null;
  }

  return (
    <div className="network-status-container" role="status" aria-live="polite">
      {isOffline && !isReconnecting && (
        <button
          type="button"
          className="network-pill offline"
          onClick={manualRefresh}
          title="இணைய இணைப்பை மீண்டும் சரிபார்க்க கிளிக் செய்யவும்"
        >
          <WifiOff size={13} className="network-pill-icon" />
          <span className="network-pill-text">ஆஃப்லைன் • சேமித்தவை</span>
          <span className="network-pill-action">மீளமை</span>
        </button>
      )}

      {isReconnecting && (
        <div className="network-pill reconnecting">
          <Loader2 size={13} className="network-pill-icon spin-icon" />
          <span className="network-pill-text">இணைக்கப்படுகிறது...</span>
        </div>
      )}

      {wasOfflineRecently && !isOffline && !isReconnecting && (
        <div className="network-pill back-online">
          <Check size={13} className="network-pill-icon" />
          <span className="network-pill-text">இணையம் மீண்டும் இணைக்கப்பட்டது</span>
        </div>
      )}
    </div>
  );
}
