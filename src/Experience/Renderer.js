import * as THREE from 'three/webgpu'
import Experience from './Experience.js'
import State from "@experience/State.js";

export default class Renderer {
    constructor() {
        this.experience = new Experience()

        this.canvas = this.experience.canvas
        this.sizes = this.experience.sizes

        this.debug = this.experience.debug
        this.resources = this.experience.resources
        this.html = this.experience.html

        // Frame pacing for ultra-smooth rendering
        this.targetFrameTime = 1000 / 60
        this.lastRenderTime = 0
        this.frameAccumulator = 0

        this.setInstance()
        this.setDebug()
    }

    _setupPerformanceListeners() {
        // Listen for quality changes to adjust pixel ratio
        if (this.experience.performance) {
            this.experience.performance.on('qualitychange', (data) => {
                const settings = data.settings

                // Update pixel ratio based on quality settings
                this.instance.setPixelRatio(settings.pixelRatio)

                console.log(`[Renderer] Pixel ratio adjusted to ${settings.pixelRatio.toFixed(2)} for ${data.level} quality`)
            })
        }
    }

    postInit() {
        this.camera = this.experience.mainCamera.instance
        this.scene = this.experience.mainScene
        this.state = this.experience.state
        this._setupPerformanceListeners()
    }

    setInstance() {
        this.clearColor = '#010101'

        //console.log(THREE.WebGLRenderer.compile)

        //THREE.WebGLRenderer.prototype.compile = compilePatch.bind( THREE.WebGLRenderer.prototype.compile )

        this.instance = new THREE.WebGPURenderer( {
            canvas: this.canvas,
            //powerPreference: "high-performance",
            antialias: true,
            //samples: 4,
            alpha: false,
            stencil: false,
            depth: true,
            useLegacyLights: false,
            physicallyCorrectLights: true,
            forceWebGL: false
        } )

        this.instance.shadowMap.enabled = true;
        //this.instance.shadowMap.type = THREE.PCFShadowMap;
        this.instance.shadowMap.type = THREE.PCFSoftShadowMap;


        //this.instance.compile = compilePatch.bind( this.instance.compile )

        this.instance.outputColorSpace = THREE.SRGBColorSpace
        this.instance.setSize( this.sizes.width, this.sizes.height )
        this.instance.setPixelRatio( Math.min( this.sizes.pixelRatio, 2 ) )

        this.instance.setClearColor( this.clearColor, 1 )
        this.instance.setSize( this.sizes.width, this.sizes.height )

        this.instance.toneMapping = THREE.ACESFilmicToneMapping
        //this.instance.toneMapping = THREE.AgXToneMapping
        this.instance.toneMappingExposure = 1.2
    }

    setDebug() {
        if ( this.debug.active ) {
            if ( this.debug.panel ) {
                const debugFolder = this.debug.panel.addFolder({
                    title: 'Renderer',
                    expanded: false,
                });

                debugFolder.addBinding( this.instance, "toneMapping", {
                    label: "Tone Mapping",
                    options: {
                        "No": THREE.NoToneMapping,
                        "Linear": THREE.LinearToneMapping,
                        "Reinhard": THREE.ReinhardToneMapping,
                        "Cineon": THREE.CineonToneMapping,
                        "ACESFilmic": THREE.ACESFilmicToneMapping,
                        "AgXToneMapping": THREE.AgXToneMapping,
                        "NeutralToneMapping": THREE.NeutralToneMapping
                    }
                } ).on( 'change', () => {
                    if ( this.state.postprocessing ) {
                        this.experience.postProcess.composer.needsUpdate = true
                    }
                })

                // this.debugFolder.add( this.instance, "toneMappingExposure" )
                //     .min( 0 ).max( 2 ).step( 0.01 ).name( "Tone Mapping Exposure" );

                debugFolder.addBinding( this.instance, "toneMappingExposure", {
                    min: 0,
                    max: 2,
                    step: 0.01,
                    label: "Tone Mapping Exposure"
                } )
            }

        }
    }

    update() {
        if ( this.debug.active ) {
            this.debugRender()
        } else {
            this.productionRender()
        }
    }

    productionRender() {
        this.instance.renderAsync( this.scene, this.camera )
    }

    debugRender() {
        this.instance.renderAsync( this.scene, this.camera )
    }

    resize() {
        // Instance
        // console.log(this.sizes.width, this.sizes.height)
        this.instance.setSize( this.sizes.width, this.sizes.height )
        this.instance.setPixelRatio( this.sizes.pixelRatio )
    }

    destroy() {

    }
}
