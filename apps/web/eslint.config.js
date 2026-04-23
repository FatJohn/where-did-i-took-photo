import antfu from '@antfu/eslint-config'

export default antfu({
  vue: true,
  typescript: {
    overrides: {
      'ts/no-explicit-any': 'error',
      'ts/no-non-null-assertion': 'error',
    },
  },
  ignores: ['dist', 'coverage', 'node_modules'],
})
