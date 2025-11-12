export default [
    // {
    //     name: 'exampleSound',
    //     type: 'audio',
    //     path: './sounds/example.mp3'
    // },
    // {
    //     name: 'exampleModel',
    //     type: 'gltfModel',
    //     path: './models/example.glb'
    // },
    // {
    //     name: 'exampleModel',
    //     type: 'gltfModel',
    //     path: './models/points_3.glb',
    //     meta: {
    //         "type": "gltfModel"
    //     }
    // },
    // {
    //     name: 'exampleAttribute',
    //     type: 'json',
    //     path: './models/attr.json',
    //     meta: {
    //         "type": "json"
    //     }
    // },

    {
        name: 'displacementTexture',
        type: 'texture',
        obfuscate: true,
        path: './textures/displacement.jpg',
        meta: {
            "type": "texture"
        }
    },
    {
        name: 'foxModel',
        type: 'gltfModel',
        obfuscate: true,
        path: './models/fox.glb',
        meta: {
            "type": "gltfModel"
        }
    },
    {
        name: 'damagedHelmetModel',
        type: 'gltfModel',
        obfuscate: true,
        path: './models/DamagedHelmet.glb',
        meta: {
            "type": "gltfModel"
        }
    },

    // Grass
    {
        name: 'grass1Texture',
        type: 'texture',
        obfuscate: true,
        path: './textures/grass/grass1.png',
        meta: {
            "type": "texture"
        }
    },
    {
        name: 'grass2Texture',
        type: 'texture',
        obfuscate: true,
        path: './textures/grass/grass2.png',
        meta: {
            "type": "texture"
        }
    },
    {
        name: 'gridTexture',
        type: 'texture',
        obfuscate: true,
        path: './textures/grass/grid.png',
        meta: {
            "type": "texture"
        }
    },
    {
        name: 'tileDataTexture',
        type: 'texture',
        obfuscate: true,
        path: './textures/grass/tileData.jpg',
        meta: {
            "type": "texture"
        }
    },
    {
        name: 'starsTexture',
        type: 'texture',
        obfuscate: true,
        path: './textures/hdr/nebula.png',
        meta: {
            "type": "exrTexture"
        }
    },
    // FastHDR environment map (KTX2 format for 10x faster loading and 95% less GPU memory)
    // To use FastHDR, download a .pmrem.ktx2 file from https://cdn.needle.tools/static/hdris/
    // and place it in ./textures/hdr/ folder, then uncomment this:
    // {
    //     name: 'environmentHDR',
    //     type: 'ktx2',
    //     obfuscate: true,
    //     path: './textures/hdr/nebula.pmrem.ktx2',
    //     meta: {
    //         "type": "ktx2",
    //         "mapping": "CubeUVReflection"
    //     }
    // },
    {
        name: 'noiseDeepTexture',
        type: 'texture',
        obfuscate: true,
        path: './textures/noise_deep.png',
        meta: {
            "type": "texture"
        }
    },
]
