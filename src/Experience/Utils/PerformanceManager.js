import EventEmitter from './EventEmitter.js'

/**
 * PerformanceManager - Monitors FPS and automatically adjusts quality settings
 * to maintain 60fps performance
 */
export default class PerformanceManager extends EventEmitter {
    constructor() {
        super()

        // Performance tracking
        this.targetFPS = 60
        this.targetFrameTime = 1000 / this.targetFPS
        this.fps = 60
        this.frameTime = 0

        // Frame time samples for smoothing
        this.frameTimes = []
        this.maxSamples = 120 // 2 seconds at 60fps

        // Temporal smoothing
        this.smoothedFPS = 60
        this.smoothingFactor = 0.1 // Lower = smoother but slower response

        // Predictive frame budget
        this.frameBudget = this.targetFrameTime
        this.budgetMargin = 2 // ms of safety margin

        // Quality levels
        this.qualityLevel = 'high' // 'low', 'medium', 'high', 'ultra'
        this.qualitySettings = {
            low: {
                iterations: 64,
                stepSize: 0.014,
                pixelRatio: 1.0,
                bloomEnabled: false,
                shadowsEnabled: false
            },
            medium: {
                iterations: 96,
                stepSize: 0.0095,
                pixelRatio: Math.min(window.devicePixelRatio, 1.5),
                bloomEnabled: true,
                shadowsEnabled: false
            },
            high: {
                iterations: 128,
                stepSize: 0.0071,
                pixelRatio: Math.min(window.devicePixelRatio, 2),
                bloomEnabled: true,
                shadowsEnabled: true
            },
            ultra: {
                iterations: 192,
                stepSize: 0.0047,
                pixelRatio: Math.min(window.devicePixelRatio, 2),
                bloomEnabled: true,
                shadowsEnabled: true
            }
        }

        // Adaptive quality settings - DISABLED for maximum performance
        this.autoAdjustEnabled = false
        this.adjustmentCooldown = 0
        this.cooldownDuration = 120 // frames (2 seconds at 60fps)

        // Performance thresholds
        this.lowFPSThreshold = 50
        this.stableFPSThreshold = 58
        this.highFPSThreshold = 59

        // Consecutive frame counters
        this.consecutiveLowFrames = 0
        this.consecutiveHighFrames = 0
        this.requiredConsecutiveFrames = 60 // 1 second

        // Initialize
        this.lastTime = performance.now()

        // Detect initial quality based on device
        this.detectInitialQuality()
    }

    detectInitialQuality() {
        // Start at ultra quality - let it auto-adjust down if needed
        this.qualityLevel = 'ultra'
    }

    update(deltaTime) {
        // Calculate FPS
        const currentTime = performance.now()
        this.frameTime = currentTime - this.lastTime
        this.lastTime = currentTime

        // Add to samples
        this.frameTimes.push(this.frameTime)
        if (this.frameTimes.length > this.maxSamples) {
            this.frameTimes.shift()
        }

        // Calculate average FPS over samples
        const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
        const instantFPS = 1000 / avgFrameTime

        // Apply exponential smoothing for super smooth FPS display
        this.smoothedFPS = this.smoothedFPS + this.smoothingFactor * (instantFPS - this.smoothedFPS)
        this.fps = this.smoothedFPS

        // Predictive frame budget (anticipate performance issues)
        const frameTimeVariance = this.calculateVariance()
        this.frameBudget = avgFrameTime + Math.sqrt(frameTimeVariance)

        // Auto-adjust quality if enabled
        if (this.autoAdjustEnabled) {
            this.autoAdjustQuality()
        }
    }

    calculateVariance() {
        if (this.frameTimes.length < 2) return 0

        const mean = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
        const squaredDiffs = this.frameTimes.map(ft => Math.pow(ft - mean, 2))
        return squaredDiffs.reduce((a, b) => a + b, 0) / this.frameTimes.length
    }

    autoAdjustQuality() {
        // Cooldown check
        if (this.adjustmentCooldown > 0) {
            this.adjustmentCooldown--
            return
        }

        // Only adjust after we have enough samples
        if (this.frameTimes.length < 60) {
            return
        }

        const currentFPS = this.fps

        // Predictive adjustment: check if we're approaching frame budget
        const isApproachingBudget = this.frameBudget > (this.targetFrameTime - this.budgetMargin)

        // Track consecutive low/high frames with predictive logic
        if (currentFPS < this.lowFPSThreshold || isApproachingBudget) {
            this.consecutiveLowFrames++
            this.consecutiveHighFrames = 0
        } else if (currentFPS > this.highFPSThreshold && !isApproachingBudget) {
            this.consecutiveHighFrames++
            this.consecutiveLowFrames = 0
        } else {
            // Reset both if in middle range
            this.consecutiveLowFrames = 0
            this.consecutiveHighFrames = 0
        }

        // Decrease quality if consistently low FPS (faster response for drops)
        if (this.consecutiveLowFrames >= this.requiredConsecutiveFrames * 0.8) {
            this.decreaseQuality()
            this.consecutiveLowFrames = 0
            this.adjustmentCooldown = this.cooldownDuration
        }

        // Increase quality if consistently high FPS (slower, more cautious)
        if (this.consecutiveHighFrames >= this.requiredConsecutiveFrames * 2.5) {
            this.increaseQuality()
            this.consecutiveHighFrames = 0
            this.adjustmentCooldown = this.cooldownDuration
        }
    }

    decreaseQuality() {
        const levels = ['ultra', 'high', 'medium', 'low']
        const currentIndex = levels.indexOf(this.qualityLevel)

        if (currentIndex < levels.length - 1) {
            const newLevel = levels[currentIndex + 1]
            console.log(`[PerformanceManager] Decreasing quality: ${this.qualityLevel} → ${newLevel} (FPS: ${this.fps.toFixed(1)})`)
            this.setQualityLevel(newLevel)
        }
    }

    increaseQuality() {
        const levels = ['ultra', 'high', 'medium', 'low']
        const currentIndex = levels.indexOf(this.qualityLevel)

        if (currentIndex > 0) {
            const newLevel = levels[currentIndex - 1]
            console.log(`[PerformanceManager] Increasing quality: ${this.qualityLevel} → ${newLevel} (FPS: ${this.fps.toFixed(1)})`)
            this.setQualityLevel(newLevel)
        }
    }

    setQualityLevel(level) {
        if (!this.qualitySettings[level]) {
            console.warn(`Invalid quality level: ${level}`)
            return
        }

        this.qualityLevel = level
        this.trigger('qualitychange', {
            level,
            settings: this.getQualitySettings()
        })

        // Clear frame samples to get fresh data after adjustment
        this.frameTimes = []
    }

    getQualitySettings() {
        return this.qualitySettings[this.qualityLevel]
    }

    getFPS() {
        return this.fps
    }

    getFrameTime() {
        return this.frameTime
    }

    setAutoAdjust(enabled) {
        this.autoAdjustEnabled = enabled
        if (!enabled) {
            this.consecutiveLowFrames = 0
            this.consecutiveHighFrames = 0
        }
    }

    setTargetFPS(fps) {
        this.targetFPS = fps
        this.targetFrameTime = 1000 / fps
    }

    getStats() {
        return {
            fps: this.fps,
            frameTime: this.frameTime,
            qualityLevel: this.qualityLevel,
            autoAdjustEnabled: this.autoAdjustEnabled,
            settings: this.getQualitySettings()
        }
    }
}
