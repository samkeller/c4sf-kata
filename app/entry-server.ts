import { renderToString } from 'vue/server-renderer'
import type { RenderFn } from '../shared/ssr.ts'
import { createApp } from './main.ts'

export const render: RenderFn = async () => {
  const { app } = createApp()
  const html = await renderToString(app)
  return { html, head: '' }
}
