import { describe, it, expect } from 'vitest'
import { parseFeed, parseWebSources } from '../src/lib/webIngest'

const RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>DMC</title>
  <item>
    <title>Aviso meteorológico AAA4</title>
    <link>https://dmc.cl/aviso/1</link>
    <guid>dmc-1</guid>
    <pubDate>Wed, 15 Aug 2026 10:00:00 GMT</pubDate>
    <description>Lluvia intensa en la región</description>
  </item>
  <item>
    <title>Aviso 2</title>
    <link>https://dmc.cl/aviso/2</link>
    <guid>dmc-2</guid>
    <description>Viento</description>
  </item>
</channel></rss>`

const ATOM = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>SENAPRED</title>
  <entry>
    <title>Alerta Amarilla</title>
    <link href="https://senapred.cl/alerta/1"/>
    <id>sen-1</id>
    <updated>2026-08-15T10:00:00Z</updated>
    <summary>Alerta Amarilla para 5 comunas</summary>
  </entry>
</feed>`

describe('monitoreo de webs (RF-20)', () => {
  it('parsea un feed RSS', () => {
    const items = parseFeed(RSS)
    expect(items).toHaveLength(2)
    expect(items[0].title).toBe('Aviso meteorológico AAA4')
    expect(items[0].link).toBe('https://dmc.cl/aviso/1')
    expect(items[0].guid).toBe('dmc-1')
    expect(items[0].published).toBeGreaterThan(0)
    expect(items[0].summary).toContain('Lluvia')
  })

  it('parsea un feed Atom (link por href, id como guid)', () => {
    const items = parseFeed(ATOM)
    expect(items).toHaveLength(1)
    expect(items[0].title).toBe('Alerta Amarilla')
    expect(items[0].link).toBe('https://senapred.cl/alerta/1')
    expect(items[0].guid).toBe('sen-1')
    expect(items[0].summary).toContain('5 comunas')
  })

  it('feed vacío o inválido devuelve lista vacía', () => {
    expect(parseFeed('<rss><channel></channel></rss>')).toEqual([])
    expect(parseFeed('no es xml')).toEqual([])
  })

  it('parsea la configuración de fuentes web', () => {
    expect(parseWebSources('')).toEqual([])
    expect(parseWebSources('json-malo')).toEqual([])
    const cfgs = parseWebSources('[{"url":"https://x.cl/rss","label":"X","org":"DMC"}]')
    expect(cfgs).toHaveLength(1)
    expect(cfgs[0].url).toBe('https://x.cl/rss')
    expect(cfgs[0].label).toBe('X')
  })
})
