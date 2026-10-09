import { test, expect } from '@playwright/test';
test('Pages works under project path without API: images, direct product link, profile and WhatsApp',async({page,context})=>{
 const errors=[],api=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',req=>{if(new URL(req.url()).pathname.startsWith('/api/'))api.push(req.url());});
 await context.grantPermissions(['clipboard-read','clipboard-write']);await page.goto('./');await expect(page.locator('.product-card')).toHaveCount(6);await expect(page.locator('header img, footer img')).toHaveCount(0);
 expect(await page.locator('.hero-art img').evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
 for(const img of await page.locator('.product-card img').all()){await img.scrollIntoViewIfNeeded();await expect.poll(()=>img.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);}
 await page.goto('./#/produto/mochila-urbana');await expect(page.getByRole('heading',{name:'Mochila Urbana',exact:true})).toBeVisible();await page.getByRole('button',{name:'Copiar link do produto'}).click();expect(await page.evaluate(()=>navigator.clipboard.readText())).toContain('/BANCADA.az/#/produto/mochila-urbana');
 const directChat=new URL(await page.getByRole('link',{name:'Conversar sobre este produto'}).getAttribute('href'));expect(directChat.searchParams.get('text')).toContain('/BANCADA.az/assets/mochila-urbana.webp');
 await page.getByRole('button',{name:'Comprar este produto'}).click();await page.getByLabel('Nome completo').fill('Cliente Pages');await page.getByLabel('Telefone de Angola').fill('929560940');await page.locator('select[name="province"]').selectOption('Icolo e Bengo');await page.locator('select[name="municipality"]').selectOption('Catete');await page.getByLabel('Endereço de entrega').fill('Rua de teste');await page.getByLabel('Ponto de referência').fill('Ao lado da escola');await page.getByRole('checkbox',{name:'Guardar os dados neste dispositivo'}).check();await page.getByRole('button',{name:'Preparar pedido no WhatsApp'}).click();const url=new URL(await page.getByRole('link',{name:'Abrir WhatsApp e enviar pedido'}).getAttribute('href'));expect(url.pathname).toBe('/244929560940');for(const text of ['Cliente Pages','Catete','Ao lado da escola','/BANCADA.az/assets/mochila-urbana.webp'])expect(url.searchParams.get('text')).toContain(text);
 await page.goto('./#/conta');await expect(page.getByRole('heading',{name:'Os seus dados de entrega.'})).toBeVisible();await expect(page.locator('[name="reference"]')).toHaveValue('Ao lado da escola');await page.getByRole('button',{name:'Guardar dados',exact:true}).click();await expect(page.locator('#form-status')).toContainText('neste dispositivo');await page.reload();await expect(page.locator('[name="name"]')).toHaveValue('Cliente Pages');await page.getByRole('button',{name:'Apagar os meus dados'}).click();await expect(page.locator('[name="name"]')).toHaveValue('');
 await page.setViewportSize({width:390,height:844});await page.goto('./');await expect(page.locator('.product-card')).toHaveCount(6);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);expect(api).toEqual([]);expect(errors).toEqual([]);
});

test('minimal storefront remains usable at small and medium screen widths', async ({page}) => {
 await page.goto('./');
 await expect(page.locator('.hero h1')).toBeVisible();
 for (const width of [320, 360, 390, 768, 1024]) {
  await page.setViewportSize({width,height:900});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const heading = await page.locator('.hero h1').boundingBox();
  const hero = await page.locator('.hero').boundingBox();
  expect(heading.x + heading.width).toBeLessThanOrEqual(hero.x + hero.width);
  await expect(page.getByRole('link',{name:'Explorar produtos'})).toBeVisible();
  await expect(page.getByRole('link',{name:'Minha conta'})).toBeVisible();
  await expect(page.getByRole('link',{name:'Carrinho (0)',exact:true})).toBeVisible();
 }
});
