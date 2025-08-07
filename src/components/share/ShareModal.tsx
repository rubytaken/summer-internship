'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Check, Globe, Lock, Share2, ExternalLink } from 'lucide-react';
import { ProjectService } from '@/lib/projects/service';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | null;
  projectName: string;
}

export default function ShareModal({ isOpen, onClose, projectId, projectName }: ShareModalProps) {
  const [shareToken, setShareToken] = useState<string>('');
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>('');

  // Generate share URL
  const shareUrl = shareToken 
    ? `${window.location.origin}/shared/${shareToken}`
    : '';

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setShareToken('');
      setIsPublic(false);
      setCopied(false);
      setError('');
    }
  }, [isOpen]);

  // Handle share generation
  const handleShare = async (makePublic: boolean = false) => {
    if (!projectId) {
      setError('No project selected');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = await ProjectService.shareProject(projectId, makePublic);
      setShareToken(token);
      setIsPublic(makePublic);
    } catch (error) {
      console.error('Share error:', error);
      setError('Failed to share project');
    } finally {
      setLoading(false);
    }
  };

  // Handle unshare
  const handleUnshare = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      await ProjectService.unshareProject(projectId);
      setShareToken('');
      setIsPublic(false);
      setCopied(false);
    } catch (error) {
      console.error('Unshare error:', error);
      setError('Failed to remove sharing');
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      setError('Failed to copy link');
    }
  };

  // Open in new tab
  const openInNewTab = () => {
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 backdrop-blur-md bg-black/40 flex items-center justify-center z-[60] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-lg border border-white/20 animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Share2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Share Project</h2>
              <p className="text-sm text-gray-500">Generate a link to share your diagram</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100/50 rounded-xl transition-all duration-200 hover:rotate-90"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{projectName}</h3>
            <p className="text-sm text-gray-500">
              Create a secure link to share your diagram with others
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50/80 border border-red-200 rounded-xl">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          )}

          {!shareToken ? (
            // Share options
            <div className="grid gap-4">
              <button
                onClick={() => handleShare(false)}
                disabled={loading || !projectId}
                className="group w-full p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-blue-200/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-600 rounded-lg group-hover:scale-110 transition-transform duration-200">
                    <Lock className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium text-gray-900">
                      {loading ? 'Generating secure link...' : 'Private Link'}
                    </div>
                    <p className="text-sm text-gray-600">
                      Only people with the link can view
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleShare(true)}
                disabled={loading || !projectId}
                className="group w-full p-4 bg-gradient-to-r from-green-50 to-emerald-100/50 border border-green-200 rounded-xl hover:from-green-100 hover:to-emerald-200/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-600 rounded-lg group-hover:scale-110 transition-transform duration-200">
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-medium text-gray-900">
                      {loading ? 'Making public...' : 'Public Link'}
                    </div>
                    <p className="text-sm text-gray-600">
                      Anyone can find and view this diagram
                    </p>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            // Shared link display
            <div className="space-y-5">
              {/* Status Badge */}
              <div className="flex items-center justify-center">
                <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${
                  isPublic 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}>
                  {isPublic ? (
                    <>
                      <Globe className="w-4 h-4 mr-2" />
                      Public - Anyone can view
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Private - Link only
                    </>
                  )}
                </div>
              </div>

              {/* Link Display */}
              <div className="bg-gray-50/80 border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Share Link</span>
                  {copied && (
                    <span className="text-sm text-green-600 flex items-center">
                      <Check className="w-4 h-4 mr-1" />
                      Copied!
                    </span>
                  )}
                </div>
                
                {/* URL Display with smart truncation */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 font-mono text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 truncate flex-shrink min-w-0">
                      {shareUrl?.split('/shared/')[0] || window.location.origin}/shared/
                    </span>
                    <span className="text-gray-800 font-semibold break-all">
                      {shareUrl?.split('/shared/')[1] || '...'}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex-1 flex items-center justify-center space-x-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={openInNewTab}
                    className="flex items-center justify-center p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Stop Sharing Button */}
              <button
                onClick={handleUnshare}
                disabled={loading}
                className="w-full p-3 text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-all duration-200 disabled:opacity-50 font-medium"
              >
                {loading ? 'Removing access...' : 'Stop Sharing'}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100/50 bg-gray-50/30">
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-lg transition-all duration-200 font-medium"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
