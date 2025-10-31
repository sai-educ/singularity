import * as THREE from 'three/webgpu'
import * as Helpers from '@experience/Utils/Helpers.js'
import Model from '@experience/Worlds/Abstracts/Model.js'
import Experience from '@experience/Experience.js'
import Debug from '@experience/Utils/Debug.js'
import State from "@experience/State.js";

import {
    sin, positionLocal, time, vec2, vec3, vec4, uv, uniform, color, fog, rangeFogFactor, texture, If, min,
    range, instanceIndex, step, mix, max, uint, varying, Fn, struct, output, emissive, diffuseColor, PI, PI2, oneMinus, cos, atan, float,
    pass, mrt, viewportDepthTexture, screenUV, linearDepth, depth, viewportLinearDepth, mod, floor, fract, smoothstep, clamp, abs, blendOverlay,
    normalView, reflect, normalize, positionViewDirection, asin, positionView, mx_rgbtohsv, mx_hsvtorgb, positionWorld,
    positionGeometry, modelWorldMatrix, objectPosition, userData, rotate, mat3, mul, mx_fractal_noise_vec3, faceDirection,
    inverse, modelViewMatrix, transformDirection, modelViewPosition, modelWorldMatrixInverse, cameraWorldMatrix,
    cameraPosition, positionWorldDirection, sub, dot, Loop, length, remap, remapClamp, lengthSq, equirectUV
} from 'three/tsl'
``
import {
    ColorRamp2_Linear, ColorRamp3_Linear, srgbToLinear, linearToSrgb, noise21, Rot, adjustTemperature, adjustHue,
    adjustSaturation, adjustLevels, fbm, hash12, brickTexture, vecToFac, mixColorHSV, emission, ColorRamp2_Constant,
    rotateZ, rotateAxis, ColorRamp3_BSpline, ColorRamp4_BSpline
} from '@experience/Utils/TSL-utils.js'

export default class ExampleClass extends Model {
    experience = Experience.getInstance()
    debug = this.experience.debug
    state = this.experience.state
    input = experience.input
    time = experience.time
    renderer = experience.renderer.instance
    resources = experience.resources
    container = new THREE.Group();

    uniforms = {
        iterations: uniform( float( 128 ) ),
        stepSize: uniform( float( 0.0071 ) ),
        noiseFactor: uniform( float( 0.01 ) ),
        power: uniform( float( 0.22 ) ),

        clamp1: uniform( float( 0.5 ) ),
        clamp2: uniform( float( 1.0 ) ),

        originRadius: uniform( float( 0.05 ) ),
        width: uniform( float( 0.03 ) ),
        uvMotion: uniform( float(0) ),

        rampCol1: uniform( color( 1, 0.666, 0.29 ) ),
        rampPos1: uniform( float( 0.050 ) ),
        rampCol2: uniform( color( 0.35, 0.13, 0.09 ) ),
        rampPos2: uniform( float( 0.425 ) ),
        rampCol3: uniform( color( 0,0,0 ) ),
        rampPos3: uniform( float( 1.0 ) ),

        rampEmission: uniform( float( 2.0 ) ),

        test1: uniform( float( 0 ) ),
        test2: uniform( float( 0 ) ),
        test3: uniform( float( 1 ) ),
        test4: uniform( float( 1 ) )
    }

    constructor( parameters = {} ) {
        super()

        this.world = parameters.world
        this.camera = this.world.camera.instance
        this.scene = this.world.scene
        this.transformControls = this.world.camera.transformControls

        this.init()
        this._setDebug()

        //this.testArrays()
    }

    testArrays() {
        const buffer = new SharedArrayBuffer( 4 * Float32Array.BYTES_PER_ELEMENT );
        //const arr = new Float32Array(buffer, 0, 2);
        const arr = new Int32Array( buffer, 0, 2 );

        Atomics.store( arr, 0, 99999999999999 );

        const value = Atomics.load( arr, 0 );

        console.log( value )

    }

    init() {
        this.setModel()
        //this.setBlackHoleModel()
    }

    postInit() {

    }

    setModel() {
        /**
         * Fox Model
         */
        this.foxModel = this.resources.items.foxModel.scene
        this.foxModel.scale.setScalar( 0.03 )
        //this.container.add( this.foxModel )

        this.damagedHelmet = this.resources.items.damagedHelmetModel.scene
        this.damagedHelmet.position.set( 0, 0, 2 )
        this.container.add( this.damagedHelmet )

        this.transformControls.attach( this.damagedHelmet )


        /**
         * Dummy
         */
            // Material
        const material = new THREE.MeshBasicNodeMaterial()

        // Uniforms
        const timeFrequency = uniform( 0.5 )
        const positionFrequency = uniform( 2 )
        const intensityFrequency = uniform( 0.5 )

        // Position
        const oscillation = sin( time.mul( timeFrequency ).add( positionLocal.y.mul( positionFrequency ) ) ).mul( intensityFrequency )
        material.positionNode = vec3(
            positionLocal.x.add( oscillation ),
            positionLocal.y,
            positionLocal.z
        )

        // Color
        material.colorNode = vec4( uv().mul( vec2( 32, 8 ) ).fract(), 1, 1 )

        // Mesh
        const mesh = new THREE.Mesh( new THREE.TorusKnotGeometry( 1, 0.35, 128, 32 ), material )
        this.container.add( mesh )
        this.scene.add( this.container )
    }

    setBlackHoleModel() {
        // add shpere
        const geometry = new THREE.SphereGeometry( 1, 64, 64 )

        const material = new THREE.MeshStandardNodeMaterial({
            side: THREE.DoubleSide
        })

        const whiteNoise3D = (coord) =>
            fract(sin(dot(coord, vec3(12.9898, 78.233, 37.719))).mul(43758.5453));

        const whiteNoise2D = (coord) => fract(sin(dot(coord, vec2(12.9898, 78.233))).mul(43758.5453));

        const lengthSqrt = Fn( ( [v] ) => {
            return v.x.mul(v.x).add( v.y.mul(v.y) ).add( v.z.mul(v.z) ).sqrt()
        })

        const smoothRange = /*@__PURE__*/ Fn( ( [ value, inMin, inMax, outMin, outMax ] ) => {

            const t = clamp( ( value.sub( inMin ) ).div( inMax.sub( inMin ) ), 0.0, 1.0 );
            const smoothT = t.mul( t ).mul( float(3.0).sub( t.mul( 2.0 ) ) ); // smoothstep curve
            return mix( outMin, outMax, smoothT );

        }, { value: 'float', inMin: 'float', inMax: 'float', outMin: 'float', outMax: 'float', return: 'float' } );

        this.resources.items.noiseDeepTexture.wrapS = THREE.RepeatWrapping
        this.resources.items.noiseDeepTexture.wrapT = THREE.RepeatWrapping
        this.resources.items.noiseDeepTexture.needsUpdate = true

        material.colorNode = Fn( () => {
            const stepSize = this.uniforms.stepSize.toVar()
            const noiseFactor = this.uniforms.noiseFactor.toVar()
            const textureCoordsObject = positionGeometry.mul( vec3( 1, 1, -1 ) ).xzy.toVar()
            const backFacing = step( 0.0, faceDirection.negate() ).toVar() // 1 — backface, 0 — front
            //const pointCameraObject = transformDirection( cameraPosition, modelViewMatrix ).toVar()
            const pointCameraObject = cameraPosition.mul(modelWorldMatrix).mul( vec3( 1, 1, -1 ) ).xzy // Vector Transform (Point) Camera to Object (input vec3(0,0,0))
            const mixedCoords = mix(textureCoordsObject, pointCameraObject.xyz, backFacing).toVar()

            const incomingWorld = normalize( sub( cameraPosition, positionWorld ) ).mul( vec3( 1, 1, -1 ) ).xzy.toVar();
            const rayDir = incomingWorld.negate().toVar() // Ray Dir start

            const whiteNoseColor = whiteNoise2D(textureCoordsObject.xy).mul(noiseFactor).toVar()

            const scaledNoise = rayDir.mul( whiteNoseColor ).toVar()

            const rayPos = mixedCoords.sub( scaledNoise ).toVar() // Ray Position start

            // rayPos, rayDir, finalColor, alpha -> accumulation next loop

            const finalColor = vec3(0)
            const power = this.uniforms.power.toVar()
            const originRadius = this.uniforms.originRadius.toVar()
            const width = this.uniforms.width.toVar()
            const alpha = float( 0.0 ).toVar()

            Loop( this.uniforms.iterations, ( { i } ) => {
                // Start Top Line
                const rayPosNormalized = normalize( rayPos ).toVar()
                const rayPosLength = lengthSqrt( rayPos ).toVar()
                const multiply1 = stepSize.mul( power ).toVar()
                const multiply2 = rayPosLength.mul(rayPosLength).toVar()
                const devided = multiply1.div( multiply2 ).toVar()
                const ranged = remapClamp( rayPosLength, 1.0, 0.5, 0.0, 1.0 ).toVar()
                const multiply3 = devided.mul( ranged ).toVar()
                const topScaled = rayPosNormalized.mul( multiply3 ).toVar()
                const topSub = rayDir.sub( topScaled ).normalize().toVar()
                // End Top Line

                // Start Center LinerayDir.mul( stepSize )
                const scaled = rayDir.mul( stepSize ) // Scale rayDir by step size
                rayPos.addAssign( scaled ) // Advance ray position
                // End Center Line

                // Start Bottom line
                const bottomMultiply3 = rayPos.mul( vec3( 1, 1, 0 ) ).toVar()
                const bottomLength = lengthSqrt( bottomMultiply3 ).toVar()

                // UV section
                const uvMultiplyAdd = bottomLength.mul( 4.270 ).sub( time.mul(0.1) ).toVar()
                const axisRotate = vec3( 0, 0, 1 ).toVar()
                const uvRotation = rayPos.mul( rotateAxis( axisRotate, uvMultiplyAdd ) ).toVar()
                const uvFinal = uvRotation.mul( 2 ).toVar()
                // End UV section

                const noiseDeepTexture = texture( this.resources.items.noiseDeepTexture, uvFinal ).toVar()

                const bottomMultiply1 = width.negate().toVar()
                const bottomCombine = vec3( bottomMultiply1, 0.0, width ).toVar()
                const bottomSub1 = sub(bottomCombine, vec3(rayPos.z) ).toVar()
                const bottomMultiply2 = bottomSub1.mul(bottomSub1).toVar()
                const bottomDiv1 = bottomMultiply2.div( width )
                const bottomSub2 = width.sub( bottomDiv1 ).toVar()
                const bottomDiv2 = bottomSub2.div( width ).toVar()
                const rgbZaxis = max( bottomDiv2, 0.0 ).toVar()

                const noiseTextureMultiply1 = noiseDeepTexture.mul( rgbZaxis ).toVar()
                const noiseTextureMultiply1Length = lengthSqrt( noiseTextureMultiply1 ).toVar()

                // Start Calc Normal
                const normalScale1 = uvFinal.mul( 1.002 ).toVar()
                const normalNoiseTexture = texture( this.resources.items.noiseDeepTexture, normalScale1 ).toVar()
                const normalTextureMultiply = normalNoiseTexture.mul( rgbZaxis ).toVar()
                const normalTextureLength = lengthSqrt( normalTextureMultiply ).toVar()
                // End Calc Normal

                // Start Color
                const bottomColorSub1 = noiseTextureMultiply1Length.sub( 0.780 ).toVar()
                const bottomColorMul = bottomColorSub1.mul( 1.5 ).toVar()
                const bottomColorSub2 = noiseTextureMultiply1Length.sub( normalTextureLength ).toVar()
                const bottomColorMul2 = bottomColorSub2.mul( 19.750 ).toVar()
                const bottomColorAdd = bottomColorMul.add( bottomColorMul2 ).toVar()
                const bottomColorAdd2 = bottomLength.add( bottomColorAdd ).toVar()
                const bottomA = vec4( this.uniforms.rampCol1, this.uniforms.rampPos1 ).toVar()
                const bottomB = vec4( this.uniforms.rampCol2, this.uniforms.rampPos2 ).toVar()
                const bottomC = vec4( this.uniforms.rampCol3, this.uniforms.rampPos3 ).toVar()
                const bottomColorRamp = ColorRamp3_BSpline( bottomColorAdd2.x, bottomA, bottomB, bottomC ).toVar()
                const bottomColorRampEmission = bottomColorRamp.mul( this.uniforms.rampEmission ).toVar()
                const bottomColorRampEmissionAdd = bottomColorRampEmission.add( color(0.14, 0.129, 0.09) ).toVar()
                // End Color

                // Start Origin
                const originLength = lengthSqrt( rayPos ).toVar()
                const originLessThan = originLength.lessThan( originRadius ).toVar()
                const originMix = mix( bottomColorRampEmissionAdd, vec3(0), originLessThan ).toVar()
                // End Origin

                // Start Alpha
                const alphaSeparate = rayPos.toVar()
                const alphaAbs = abs( alphaSeparate.z ).toVar()
                const alphaSub1 = noiseTextureMultiply1Length.sub( 0.750 ).toVar()
                const alphaSub1Mul = alphaSub1.mul( -0.60 ).toVar()
                const alphaAdd1 = alphaAbs.add( alphaSub1Mul ).toVar()
                const alphaRange1 = smoothRange( bottomLength, 1.0, 0.0, 0.0, 1.0 ).toVar()
                const alphaRange2 = smoothRange( alphaAdd1, width, 0, 0, alphaRange1 ).toVar()

                const bottomAlphaMix = mix( alphaRange2, 1.0, originLessThan ).toVar()
                // End Alpha

                // End Bottom line

                // Start Final Color Accumulation
                const finalColorSub = alpha.oneMinus().toVar()
                const finalColorMul = finalColorSub.mul( vecToFac(bottomAlphaMix) ).toVar()
                const finalColorMix = mix( finalColor, originMix, finalColorMul ).toVar()
                // End Final Color Accumulation


                rayPos.addAssign( scaled ) // Advance ray position
                rayDir.assign( topSub ) // Update ray direction
                finalColor.assign( finalColorMix ) // Accumulate color
                alpha.assign( mix(alpha, 1.0, vecToFac(bottomAlphaMix)) ) // Accumulate alpha
            } );


            const rayDirOrigin  = rayDir.mul( vec3( 1, -1, 1 ) ).xzy.toVar()
            const envTextureSample = linearToSrgb(texture( this.resources.items.starsTexture, equirectUV( rayDirOrigin ) )).toVar()

            const finalSub = float( 1.0 ).sub( alpha ).toVar()
            const alphaMul = 1.0
            const finalMul = finalSub.mul( alphaMul )
            const finalColorMix = mix( finalColor, envTextureSample, finalMul ).toVar()
            const finalAlphaMix = mix( alpha, 1.0, alphaMul ).toVar()

            return srgbToLinear(finalColorMix)
        })()
        material.emissiveNode = material.colorNode


        // add plane
        const planeGeometry = new THREE.PlaneGeometry( 10, 10 )
        const planeMaterial = new THREE.MeshStandardNodeMaterial()
        planeMaterial.side = THREE.DoubleSide
        planeMaterial.colorNode = Fn( () => {
            const backFacing = step( 0.0, faceDirection.negate() ); // 1 — backface, 0 — front

            return backFacing
        })()
        planeMaterial.emissiveNode = planeMaterial.colorNode
        const planeMesh = new THREE.Mesh( planeGeometry, planeMaterial )

        const mesh = new THREE.Mesh( geometry, material )
        this.container.add( mesh )
        //this.container.add( planeMesh )
        this.scene.add( this.container )
    }

    animationPipeline() {

    }

    resize() {

    }

    _setDebug() {
        if ( !this.debug.active ) return


        const test = uniform( 0 )

        const exampleFolder = this.world.debugFolder.addFolder( {
            title: 'depth',
            expanded: true
        } )

        exampleFolder.addBinding( test, 'value', {
            label: 'TEST',
        } )

        exampleFolder.addBinding( this.uniforms.iterations, 'value', {
            label: 'Iterations',
        } )

        exampleFolder.addBinding( this.uniforms.stepSize, 'value', {
            label: 'Step Size',
        } )

        exampleFolder.addBinding( this.uniforms.noiseFactor, 'value', {
            label: 'Noise Factor',
            min: 0,
            max: 0.1,
            step: 0.0001
        } )

        exampleFolder.addBinding( this.uniforms.power, 'value', {
            label: 'Power',
        } )

        exampleFolder.addBinding( this.uniforms.clamp1, 'value', {
            label: 'Clamp 1',
        } )

        exampleFolder.addBinding( this.uniforms.clamp2, 'value', {
            label: 'Clamp 2',
        } )

        exampleFolder.addBinding( this.uniforms.originRadius, 'value', {
            label: 'Origin Radius',
        } )

        exampleFolder.addBinding( this.uniforms.width, 'value', {
            label: 'Width',
        } )

        exampleFolder.addBinding( this.uniforms.uvMotion, 'value', {
            label: 'UV Motion',
        } )

        exampleFolder.addBinding( this.uniforms.rampCol1, 'value', {
            label: 'Ramp Col 1',
            color: { type: 'float' },
        } )

        exampleFolder.addBinding( this.uniforms.rampPos1, 'value', {
            label: 'Ramp Pos 1',
        } )

        exampleFolder.addBinding( this.uniforms.rampCol2, 'value', {
            label: 'Ramp Col 2',
            color: { type: 'float' },
        } )

        exampleFolder.addBinding( this.uniforms.rampPos2, 'value', {
            label: 'Ramp Pos 2',
        } )

        exampleFolder.addBinding( this.uniforms.rampCol3, 'value', {
            label: 'Ramp Col 3',
            color: { type: 'float' },
        } )

        exampleFolder.addBinding( this.uniforms.rampPos3, 'value', {
            label: 'Ramp Pos 3',
        } )

        exampleFolder.addBinding( this.uniforms.rampEmission, 'value', {
            label: 'Ramp Emission',
        } )


        exampleFolder.addBinding( this.uniforms.test1, 'value', {
            label: 'Fast Test 1',
        } )

        exampleFolder.addBinding( this.uniforms.test2, 'value', {
            label: 'Fast Test 2',
        } )

        exampleFolder.addBinding( this.uniforms.test3, 'value', {
            label: 'Fast Test 3',
        } )

        exampleFolder.addBinding( this.uniforms.test4, 'value', {
            label: 'Fast Test 4',
        } )


        //this.debug.createDebugNode( viewportDepthTexture( uv().flipY() ).step(test), this.world )
        //this.debug.createDebugNode( viewportLinearDepth, this.world )
        //this.debug.createDebugNode( uv().step(0.1), this.world )

        // const exampleFolder = this.world.debugFolder.addFolder( {
        //     title: 'Smoke',
        //     expanded: false
        // } )
        //
        // exampleFolder.addBinding( this.uniforms.exampleColor, 'value', {
        //     label: 'Smoke Color',
        //     color: { type: 'float' }
        // } )
        //
        // exampleFolder.addBinding( this.uniforms.size, 'value', {
        //     label: 'Size',
        //     min: 0,
        //     max: 10,
        //     step: 0.01
        // } )
    }

    update( deltaTime ) {
        //this.cube2.rotation.y += deltaTime * 20
        //this.cube.rotation.y += deltaTime * 30
    }

}
