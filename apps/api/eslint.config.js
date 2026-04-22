import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: {
    overrides: {
      'ts/no-explicit-any': 'error',
      'ts/no-non-null-assertion': 'error',
    },
  },
  ignores: ['dist', 'node_modules'],
})
