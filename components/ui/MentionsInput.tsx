"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User } from 'lucide-react';
import UserProfile from './UserProfile';

export interface MentionUser {
  id: string;
  name: string | null;
  email: string | null;
  image?: string | null;
  isTeamMember?: boolean;
  isGlobalAdmin?: boolean;
}

export interface Mention {
  id: string;
  userId: string;
  name: string;
  startIndex: number;
  endIndex: number;
}

interface MentionsInputProps {
  value: string;
  onChange: (value: string) => void;
  onMentionsChange?: (mentions: Mention[]) => void;
  teamMembers: MentionUser[];
  teamAdmins?: MentionUser[];
  currentUserId?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  rows?: number;
  autoFocus?: boolean;
}

const MentionsInput: React.FC<MentionsInputProps> = ({
  value,
  onChange,
  onMentionsChange,
  teamMembers,
  teamAdmins = [],
  currentUserId,
  placeholder = "Type your message...",
  className = "",
  disabled = false,
  rows = 2,
  autoFocus = false,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionFilter, setSuggestionFilter] = useState('');
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const [mentionStartPos, setMentionStartPos] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [displayValue, setDisplayValue] = useState('');
  const [mentions, setMentions] = useState<Array<{ name: string; userId: string; displayStart: number; displayEnd: number }>>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // Convert storage format to display format and extract mentions
  const parseStorageValue = useCallback((storageValue: string) => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    let display = storageValue;
    const foundMentions: Array<{ name: string; userId: string; displayStart: number; displayEnd: number }> = [];
    
    let match;
    let offset = 0;
    
    while ((match = mentionRegex.exec(storageValue)) !== null) {
      const [fullMatch, name, userId] = match;
      const originalIndex = match.index;
      
      // Calculate display position accounting for previous replacements
      const displayIndex = originalIndex - offset;
      
      foundMentions.push({
        name,
        userId,
        displayStart: displayIndex,
        displayEnd: displayIndex + name.length
      });
      
      // Track how much we're shortening the text
      offset += fullMatch.length - name.length;
    }
    
    // Replace all mentions with just the name
    display = storageValue.replace(/@\[([^\]]+)\]\([^)]+\)/g, '$1');
    
    return { display, mentions: foundMentions };
  }, []);

  // Update display value and mentions when storage value changes
  useEffect(() => {
    if (!isInternalChange.current) {
      const { display, mentions: foundMentions } = parseStorageValue(value);
      // Only update if the display value is actually different
      if (display !== displayValue || JSON.stringify(foundMentions) !== JSON.stringify(mentions)) {
        setDisplayValue(display);
        setMentions(foundMentions);
      }
    }
    isInternalChange.current = false;
  }, [value, parseStorageValue, displayValue, mentions]);

  // Notify parent of mention changes
  useEffect(() => {
    if (onMentionsChange) {
      const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
      const mentionList: Mention[] = [];
      let match;
      
      while ((match = mentionRegex.exec(value)) !== null) {
        mentionList.push({
          id: `${match[2]}-${match.index}`,
          userId: match[2],
          name: match[1],
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        });
      }
      
      onMentionsChange(mentionList);
    }
  }, [value, onMentionsChange]);

  // Synchronize textarea and overlay scrolling
  useEffect(() => {
    if (textareaRef.current && overlayRef.current) {
      const textarea = textareaRef.current;
      const overlay = overlayRef.current;
      
      const syncScroll = () => {
        overlay.scrollTop = textarea.scrollTop;
        overlay.scrollLeft = textarea.scrollLeft;
      };
      
      textarea.addEventListener('scroll', syncScroll);
      textarea.addEventListener('input', syncScroll);
      
      // Initial sync
      syncScroll();
      
      return () => {
        textarea.removeEventListener('scroll', syncScroll);
        textarea.removeEventListener('input', syncScroll);
      };
    }
  }, []);

  // Convert display text back to storage format with mentions
  const convertToStorageFormat = useCallback((displayText: string, currentMentions: Array<{ name: string; userId: string; displayStart: number; displayEnd: number }>) => {
    if (currentMentions.length === 0) return displayText;
    
    // Sort mentions by position (reverse order to maintain positions)
    const sortedMentions = [...currentMentions].sort((a, b) => b.displayStart - a.displayStart);
    
    let storageText = displayText;
    
    for (const mention of sortedMentions) {
      const before = storageText.substring(0, mention.displayStart);
      const after = storageText.substring(mention.displayEnd);
      const mentionSyntax = `@[${mention.name}](${mention.userId})`;
      storageText = before + mentionSyntax + after;
    }
    
    return storageText;
  }, []);

  const calculateDropdownPosition = useCallback((textarea: HTMLTextAreaElement, cursorPos: number) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    const styles = window.getComputedStyle(textarea);
    ctx.font = `${styles.fontSize} ${styles.fontFamily}`;
    
    const text = displayValue.substring(0, cursorPos);
    const lines = text.split('\n');
    const currentLine = lines[lines.length - 1];
    
    const lineHeight = parseInt(styles.lineHeight) || parseInt(styles.fontSize) * 1.2;
    const paddingLeft = parseInt(styles.paddingLeft) || 0;
    const paddingTop = parseInt(styles.paddingTop) || 0;
    
    const textWidth = ctx.measureText(currentLine).width;
    const lineNumber = lines.length - 1;
    
    return {
      top: paddingTop + (lineNumber * lineHeight) - 4,
      left: paddingLeft + textWidth
    };
  }, [displayValue]);

  // Filter team members and admins for suggestions
  const filteredMembers = teamMembers.filter(member => {
    // Exclude current user
    if (currentUserId && member.id === currentUserId) return false;
    if (!suggestionFilter) return true;
    const displayName = member.name || member.email?.split('@')[0] || '';
    return displayName.toLowerCase().includes(suggestionFilter.toLowerCase());
  });

  const filteredAdmins = teamAdmins.filter(admin => {
    // Exclude current user
    if (currentUserId && admin.id === currentUserId) return false;
    if (!suggestionFilter) return true;
    const displayName = admin.name || admin.email?.split('@')[0] || '';
    return displayName.toLowerCase().includes(suggestionFilter.toLowerCase());
  });

  const allFilteredUsers = [...filteredMembers, ...filteredAdmins];

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    // Calculate what changed
    const lengthDiff = newText.length - displayValue.length;
    
    // Update mentions positions based on the change
    let updatedMentions = mentions.map(mention => {
      if (cursorPos <= mention.displayStart) {
        // Change is before the mention, adjust position
        return {
          ...mention,
          displayStart: mention.displayStart + lengthDiff,
          displayEnd: mention.displayEnd + lengthDiff
        };
      } else if (cursorPos > mention.displayStart && cursorPos < mention.displayEnd) {
        // Change is inside the mention, remove it
        return null;
      } else if (cursorPos >= mention.displayStart && cursorPos <= mention.displayEnd) {
        // Change is at the edge of mention, remove it to be safe
        return null;
      }
      // Change is after the mention, no adjustment needed
      return mention;
    }).filter(Boolean) as typeof mentions;
    
    // Validate that all mentions still exist in the text
    updatedMentions = updatedMentions.filter(mention => {
      const mentionText = newText.substring(mention.displayStart, mention.displayEnd);
      return mentionText === mention.name;
    });
    
    // Convert back to storage format
    const storageValue = convertToStorageFormat(newText, updatedMentions);
    
    setDisplayValue(newText);
    setMentions(updatedMentions);
    isInternalChange.current = true;
    onChange(storageValue);
    
    // Check for @ symbol to show suggestions
    const textBeforeCursor = newText.substring(0, Math.min(cursorPos, newText.length));
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1 && (atIndex === 0 || /\s/.test(textBeforeCursor[atIndex - 1]))) {
      const textAfterAt = textBeforeCursor.substring(atIndex + 1);
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionStartPos(atIndex);
        setSuggestionFilter(textAfterAt);
        setShowSuggestions(true);
        setSelectedSuggestionIndex(0);
        
        if (textareaRef.current) {
          const position = calculateDropdownPosition(textareaRef.current, atIndex);
          setDropdownPosition(position);
        }
        return;
      }
    }
    
    setShowSuggestions(false);
    setMentionStartPos(null);
    setDropdownPosition(null);
  };

  // Handle suggestion selection
  const selectSuggestion = (member: MentionUser) => {
    if (mentionStartPos === null) return;

    const memberName = member.name || member.email?.split('@')[0] || 'Unknown User';
    
    // Remove the @ and filter text, insert the mention
    const beforeAt = displayValue.substring(0, mentionStartPos);
    const afterFilter = displayValue.substring(mentionStartPos + 1 + suggestionFilter.length);
    const newDisplayText = beforeAt + memberName + afterFilter;
    
    // Add the new mention to our mentions list
    const newMention = {
      name: memberName,
      userId: member.id,
      displayStart: mentionStartPos,
      displayEnd: mentionStartPos + memberName.length
    };
    
    // Update other mentions positions if needed
    const updatedMentions = mentions.map(mention => {
      if (mention.displayStart >= mentionStartPos) {
        // Adjust positions for mentions after the new one
        const adjustment = memberName.length - (1 + suggestionFilter.length);
        return {
          ...mention,
          displayStart: mention.displayStart + adjustment,
          displayEnd: mention.displayEnd + adjustment
        };
      }
      return mention;
    });
    
    // Add the new mention and sort by position
    const allMentions = [...updatedMentions, newMention].sort((a, b) => a.displayStart - b.displayStart);
    
    // Convert to storage format
    const storageValue = convertToStorageFormat(newDisplayText, allMentions);
    
    setDisplayValue(newDisplayText);
    setMentions(allMentions);
    isInternalChange.current = true;
    onChange(storageValue);
    
    setShowSuggestions(false);
    setMentionStartPos(null);
    setDropdownPosition(null);
    setSuggestionFilter('');
    
    // Set cursor after mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeAt.length + memberName.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || allFilteredUsers.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < allFilteredUsers.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : allFilteredUsers.length - 1
        );
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        selectSuggestion(allFilteredUsers[selectedSuggestionIndex]);
        break;
      case 'Escape':
        setShowSuggestions(false);
        setMentionStartPos(null);
        setDropdownPosition(null);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Render text with highlighted mentions
  const renderHighlightedText = () => {
    if (!displayValue) return null;
    
    let lastIndex = 0;
    const parts = [];
    
    // Sort mentions by position
    const sortedMentions = [...mentions].sort((a, b) => a.displayStart - b.displayStart);
    
    sortedMentions.forEach((mention, idx) => {
      // Add text before mention
      if (mention.displayStart > lastIndex) {
        parts.push(
          <span key={`text-before-${idx}`}>
            {displayValue.substring(lastIndex, mention.displayStart)}
          </span>
        );
      }
      
      // Add highlighted mention
      parts.push(
        <span
          key={`mention-${idx}-${mention.userId}`}
          className="text-blue-600 dark:text-blue-400 font-medium"
        >
          {displayValue.substring(mention.displayStart, mention.displayEnd)}
        </span>
      );
      
      lastIndex = mention.displayEnd;
    });
    
    // Add remaining text
    if (lastIndex < displayValue.length) {
      parts.push(
        <span key="text-end">
          {displayValue.substring(lastIndex)}
        </span>
      );
    }
    
    return parts;
  };

  return (
    <div className="relative">
      <div className="relative overflow-hidden">
        {/* Highlight layer */}
        <div
          ref={overlayRef}
          className={`absolute inset-0 pointer-events-none whitespace-pre-wrap break-words overflow-auto mentions-overlay ${className.replace(/bg-\S+/g, '').replace(/border-\S+/g, '').replace(/focus:\S+/g, '').replace(/hover:\S+/g, '')}`}
          style={{
            fontSize: 'inherit',
            fontFamily: 'inherit', 
            lineHeight: '1.5',
            minHeight: `${rows * 1.5}em`,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            border: 'none',
            background: 'transparent',
            padding: '8px 12px', // Match px-3 py-2 from most textareas
            color: 'inherit', // Use the normal text color
          }}
          aria-hidden="true"
        >
          {displayValue ? renderHighlightedText() : (
            <span className="text-gray-500 dark:text-gray-400">
              {placeholder}
            </span>
          )}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={displayValue}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="" // Remove placeholder since we show it in overlay
          className={`relative resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent overflow-auto ${className}`}
          rows={rows}
          disabled={disabled}
          autoFocus={autoFocus}
          style={{
            background: 'transparent',
            color: 'transparent', // Always hide the text
            caretColor: 'rgb(59 130 246)', // Keep cursor visible
            WebkitTextFillColor: 'transparent', // Always hide for webkit
            textShadow: 'none',
            minHeight: `${rows * 1.5}em`,
            lineHeight: '1.5',
          }}
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && filteredMembers.length > 0 && dropdownPosition && (
        <div
          ref={suggestionsRef}
          className="absolute bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-48 overflow-y-auto min-w-[250px] z-[9999]"
          style={{
            bottom: `calc(100% - ${dropdownPosition.top}px + 4px)`,
            left: dropdownPosition.left,
          }}
        >
          {/* Team Members Section */}
          {filteredMembers.length > 0 && (
            <>
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                Members
              </div>
              {filteredMembers.map((member, index) => {
                const displayName = member.name || member.email?.split('@')[0] || 'Unknown User';
                const isSelected = index === selectedSuggestionIndex;

                return (
                  <button
                    key={member.id}
                    onClick={() => selectSuggestion(member)}
                    className={`w-full px-3 py-2 text-left flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    } transition-colors`}
                  >
                    <UserProfile user={member} size="xs" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {displayName}
                      </div>
                      {member.email && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {member.email}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </>
          )}

          {/* Admins Section */}
          {filteredAdmins.length > 0 && (
            <>
              {filteredMembers.length > 0 && (
                <div className="border-b border-gray-200 dark:border-gray-600"></div>
              )}
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                Admins
              </div>
              {filteredAdmins.map((admin, index) => {
                const displayName = admin.name || admin.email?.split('@')[0] || 'Unknown User';
                const adjustedIndex = filteredMembers.length + index;
                const isSelected = adjustedIndex === selectedSuggestionIndex;

                return (
                  <button
                    key={admin.id}
                    onClick={() => selectSuggestion(admin)}
                    className={`w-full px-3 py-2 text-left flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    } transition-colors`}
                  >
                    <UserProfile user={admin} size="xs" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex items-center">
                        {displayName}
                        <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded font-medium">
                          ADMIN
                        </span>
                      </div>
                      {admin.email && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {admin.email}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MentionsInput;