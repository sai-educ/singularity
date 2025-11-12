/**
 * FPSCounter - Displays FPS and performance info in the UI
 */
export default class FPSCounter {
    constructor(performanceManager) {
        this.performance = performanceManager
        this.enabled = true

        this.createUI()
        this.setupEventListeners()
    }

    createUI() {
        // FPS counter disabled - no UI created
        return

        // Create container
        this.container = document.createElement('div')
        this.container.id = 'fps-counter'
        this.container.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: #00ff00;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            padding: 8px 12px;
            border-radius: 4px;
            z-index: 10000;
            user-select: none;
            pointer-events: none;
            backdrop-filter: blur(4px);
            border: 1px solid rgba(0, 255, 0, 0.3);
            min-width: 150px;
        `

        // FPS display
        this.fpsElement = document.createElement('div')
        this.fpsElement.style.cssText = 'margin-bottom: 4px; font-weight: bold;'
        this.container.appendChild(this.fpsElement)

        // Frame time display
        this.frameTimeElement = document.createElement('div')
        this.frameTimeElement.style.cssText = 'margin-bottom: 4px; font-size: 10px; opacity: 0.8;'
        this.container.appendChild(this.frameTimeElement)

        // Quality level display
        this.qualityElement = document.createElement('div')
        this.qualityElement.style.cssText = 'font-size: 10px; opacity: 0.8;'
        this.container.appendChild(this.qualityElement)

        // Add to DOM
        document.body.appendChild(this.container)
    }

    setupEventListeners() {
        // FPS counter disabled - no event listeners needed
        return

        // Update quality display when it changes
        this.performance.on('qualitychange', (data) => {
            this.updateQualityDisplay(data.level)
        })

        // Update initial quality
        this.updateQualityDisplay(this.performance.qualityLevel)
    }

    update() {
        // FPS counter disabled
        return

        if (!this.enabled) return

        const fps = this.performance.getFPS()
        const frameTime = this.performance.getFrameTime()

        // Update FPS with color coding
        const fpsColor = this.getFPSColor(fps)
        this.fpsElement.textContent = `FPS: ${fps.toFixed(1)}`
        this.fpsElement.style.color = fpsColor

        // Update frame time
        this.frameTimeElement.textContent = `Frame: ${frameTime.toFixed(2)}ms`
    }

    updateQualityDisplay(quality) {
        const qualityColors = {
            low: '#ff6b6b',
            medium: '#ffd93d',
            high: '#6bcf7f',
            ultra: '#4dabf7'
        }

        this.qualityElement.textContent = `Quality: ${quality.toUpperCase()}`
        this.qualityElement.style.color = qualityColors[quality] || '#00ff00'
    }

    getFPSColor(fps) {
        if (fps >= 58) return '#00ff00' // Green
        if (fps >= 45) return '#ffd93d' // Yellow
        if (fps >= 30) return '#ff9f43' // Orange
        return '#ff6b6b' // Red
    }

    show() {
        this.enabled = true
        this.container.style.display = 'block'
    }

    hide() {
        this.enabled = false
        this.container.style.display = 'none'
    }

    toggle() {
        if (this.enabled) {
            this.hide()
        } else {
            this.show()
        }
    }

    destroy() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container)
        }
    }
}
