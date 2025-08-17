// components/NaturalLanguageInput.js
// Natural language input component for build requests

import { useState } from 'react'

export default function NaturalLanguageInput({ onSubmit, disabled, placeholder }) {
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || disabled || isProcessing) return
    
    setIsProcessing(true)
    
    try {
      // Call the onSubmit callback with the input
      await onSubmit(input)
      setInput('') // Clear input after successful submission
    } catch (error) {
      console.error('Error processing input:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="natural-language-input">
      <form onSubmit={handleSubmit}>
        <div className="input-container">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder || "Describe your ideal build..."}
            disabled={disabled || isProcessing}
            rows={4}
            className="input-field"
          />
          <button 
            type="submit" 
            disabled={disabled || isProcessing || !input.trim()}
            className="submit-btn"
          >
            {isProcessing ? 'Processing...' : 'Generate Build'}
          </button>
        </div>
      </form>
      
      <div className="examples">
        <p className="examples-title">Example requests:</p>
        <ul>
          <li>"Create a high resilience Titan build for raids"</li>
          <li>"Optimize my Hunter for PvP with max mobility"</li>
          <li>"Solar Warlock build with Sunbracers for GMs"</li>
        </ul>
      </div>

      <style jsx>{`
        .natural-language-input {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid #333;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .input-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .input-field {
          width: 100%;
          padding: 12px;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid #444;
          border-radius: 4px;
          color: #fff;
          font-size: 14px;
          resize: vertical;
          min-height: 100px;
        }

        .input-field:focus {
          outline: none;
          border-color: #ff6b35;
        }

        .input-field:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .submit-btn {
          background: #ff6b35;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .submit-btn:hover:not(:disabled) {
          background: #ff7f4f;
          transform: translateY(-1px);
        }

        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .examples {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #333;
        }

        .examples-title {
          color: #999;
          font-size: 12px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .examples ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .examples li {
          color: #666;
          font-size: 13px;
          padding: 4px 0;
          padding-left: 16px;
          position: relative;
        }

        .examples li:before {
          content: "›";
          position: absolute;
          left: 0;
          color: #ff6b35;
        }
      `}</style>
    </div>
  )
}