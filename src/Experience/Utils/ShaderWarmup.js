/**
 * ShaderWarmup - Prevents first-frame stutter by pre-compiling shaders
 */
export default class ShaderWarmup {
    constructor(renderer, scene, camera) {
        this.renderer = renderer
        this.scene = scene
        this.camera = camera
        this.isWarmedUp = false
    }

    async warmup() {
        if (this.isWarmedUp) return

        console.log('[ShaderWarmup] Pre-compiling shaders...')

        // Render a few invisible frames to compile shaders
        const originalVisible = this.scene.visible
        this.scene.visible = true

        // Store original canvas opacity
        const canvas = this.renderer.domElement
        const originalOpacity = canvas.style.opacity
        canvas.style.opacity = '0'

        // Render 3 warmup frames
        for (let i = 0; i < 3; i++) {
            await this.renderer.renderAsync(this.scene, this.camera)
        }

        // Restore visibility
        canvas.style.opacity = originalOpacity

        this.isWarmedUp = true
        console.log('[ShaderWarmup] Shaders compiled successfully')
    }
}
