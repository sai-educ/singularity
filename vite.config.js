import path from 'path'


const dirname = path.resolve()

const isCodeSandbox = 'SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env

export default ({ mode }) => ({
    root: 'src/',
    publicDir: '../static/',
    base: './',
    resolve:
        {
            alias:
                {
                    '@experience' : path.resolve(dirname, './src/Experience/'),
                }
        },
    server:
    {
        host: true,
        open: !isCodeSandbox, // Open if it's not a CodeSandbox
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp',
        },
    },
    build:
    {
        outDir: '../dist',
        emptyOutDir: true,
        sourcemap: mode !== 'production'
    },
    plugins: []
})
