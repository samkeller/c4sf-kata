import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfigWithVueTs(
  {
    name: 'project/files-to-lint',
    files: ['**/*.{ts,vue}'],
  },

  globalIgnores(['**/dist/**']),

  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,

  {
    // Règle d'architecture (AGENTS.md) : l'UI passe par `state/`, jamais directement par `api/`.
    name: 'project/ui-does-not-call-api',
    files: ['app/**/ui/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/api', '**/api/**'],
              message: 'UI components must go through state/, not call api/ directly.',
            },
          ],
        },
      ],
    },
  },

  // Le formatage est entièrement délégué à Prettier.
  skipFormatting,
)
