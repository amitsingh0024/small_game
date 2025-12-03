import { useEffect, useRef } from 'react'
import './AdSense.css'

interface AdSenseProps {
  adSlot: string
  adFormat?: 'auto' | 'rectangle' | 'vertical' | 'horizontal'
  fullWidthResponsive?: boolean
  style?: React.CSSProperties
}

/**
 * Google AdSense Component for React
 * Displays ads using Google AdSense
 */
export function AdSense({ 
  adSlot, 
  adFormat = 'auto',
  fullWidthResponsive = true,
  style 
}: AdSenseProps) {
  const adRef = useRef<HTMLModElement>(null)
  const adInitialized = useRef(false)

  useEffect(() => {
    // Only initialize once per component instance
    if (adInitialized.current || !adRef.current) return

    // Wait for AdSense script to load
    const initAd = () => {
      if (adRef.current && (window as any).adsbygoogle) {
        try {
          // Push ad to AdSense queue (Google's initialization method)
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
          adInitialized.current = true
        } catch (error) {
          console.error('Error initializing AdSense:', error)
        }
      }
    }

    // Check if AdSense is already loaded
    if ((window as any).adsbygoogle) {
      // Small delay to ensure DOM is ready
      setTimeout(initAd, 100)
    } else {
      // Wait for script to load
      const checkInterval = setInterval(() => {
        if ((window as any).adsbygoogle) {
          clearInterval(checkInterval)
          initAd()
        }
      }, 100)

      // Cleanup interval after 10 seconds
      setTimeout(() => clearInterval(checkInterval), 10000)
    }

    return () => {
      // Cleanup if needed
    }
  }, [])

  return (
    <div className="adsense-container" style={style}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          background: 'transparent',
        }}
        data-ad-client="ca-pub-8363097623676710"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
      />
    </div>
  )
}

