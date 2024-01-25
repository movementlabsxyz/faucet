import { test, expect } from '@playwright/test';

const root = "https://faucet.movementlabs.xyz/"
const pageTitle = "Movement Faucet"
const moveAddress = "0x8833c82387999a6547528e3f6c9c2089bada583e264a253fe49c66161f0ed542";
const ethAddress = "0xC7A876aCC9198ca2C05a805b06AdAec68585d30c";

function health_log({
  health_check,
  status,
  group = "movement-faucet",
  reason
}: {
  health_check: string,
  status: "PASS" | "FAIL",
  group?: string,
  reason: string
}) {

  console.log(
    `{"health_check": "${health_check}", "status": "${status}", "group": "${group}", "reason": "${reason}"}`
  )

}

test('has title', async ({ page }) => {
  await page.goto(root);

  const title = await page.title();
  health_log({
    health_check: "has-title",
    status: title === pageTitle ? "PASS" : "FAIL",
    reason: "title is present"
  })

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Movement Faucet/);

});

test('fails when ', async ({ page }) => {
  await page.goto(root);

  // Click the get started link.
  await page.click('text=Get MOVE');
  const res = await page.waitForSelector('text=Request failed with status code 404', {
    timeout : 10000
  });

  health_log({
    health_check: "fails-without-address",
    status: res ? "PASS" : "FAIL",
    reason: "faucet functional"
  })

  // Expects page to have a heading with the name of Installation.
  await expect(res).toBeDefined();

});

test('unsuccessful when wrong ethAddress', async ({ page }) => {
  await page.goto(root);

  // Click the get started link.
  await page.getByLabel("MEVM account").setChecked(true);
  await page.getByLabel("M1 Account Address").fill(moveAddress);
  await page.click('text=Get MOVE');
  const res = await page.waitForSelector('text=Invalid address. Should be of the form: 0xab12... and be 20 bytes in length', {
    timeout: 10000
  });

  health_log({
    health_check: "fails-with-wrong-address",
    status: res ? "PASS" : "FAIL",
    reason: "faucet functional"
  })

  // Expects page to have a heading with the name of Installation.
  await expect(res).toBeDefined();
});

test('unsuccessful when wrong moveAddress', async ({ page }) => {
  await page.goto(root);

  // Click the get started link.
  await page.getByLabel("MEVM account").setChecked(false);
  await page.getByLabel("M1 Account Address").fill(ethAddress);
  await page.click('text=Get MOVE');
  const res = await page.waitForSelector('text=Invalid address. Should be of the form: 0xab12... and be 32 bytes in length', {
    timeout: 10000
  });

  health_log({
    health_check: "fails-with-wrong-address",
    status: res ? "PASS" : "FAIL",
    reason: "faucet functional"
  })

  // Expects page to have a heading with the name of Installation.
  await expect(res).toBeDefined();
});

test('unsuccessful when wrong moveAddress at M2', async ({ page }) => {
  await page.goto(root);

  // Click the get started link.
  await page.getByLabel("M2 Account Address").fill(ethAddress);
  await page.click('text=Get MOVE');
  const res = await page.waitForSelector('text=Invalid address. Should be of the form: 0xab12... and be 32 bytes in length', {
    timeout: 10000
  });

  health_log({
    health_check: "fails-with-wrong-address",
    status: res ? "PASS" : "FAIL",
    reason: "faucet functional"
  })

  // Expects page to have a heading with the name of Installation.
  await expect(res).toBeDefined();
});

test('successful when correct ethAddress', async ({ page }) => {
  await page.goto(root);

  // Click the get started link.
  await page.getByLabel("MEVM account").setChecked(true);
  await page.getByLabel("M1 Account Address").fill(ethAddress);
  await page.click('text=Get MOVE');
  const res = await page.waitForSelector('text=Funded account 1 MOVE', {
    timeout : 10000000
  });

  health_log({
    health_check: "fails-with-wrong-address",
    status: res ? "PASS" : "FAIL",
    reason: "faucet functional"
  })

  // Expects page to have a heading with the name of Installation.
  await expect(res).toBeDefined();
});

test('successful when moveAddress', async ({ page }) => {
  await page.goto(root);

  // Click the get started link.
  await page.getByLabel("MEVM account").setChecked(false);
  await page.getByLabel("M1 Account Address").fill(moveAddress);
  await page.click('text=Get MOVE');
  const res = await page.waitForSelector('text=Funded account 10 MOVE', {
    timeout : 10000
  });

  health_log({
    health_check: "fails-with-wrong-address",
    status: res ? "PASS" : "FAIL",
    reason: "faucet functional"
  })

  // Expects page to have a heading with the name of Installation.
  await expect(res).toBeDefined();
});

test('successful when moveAddress in M2', async ({ page }) => {
  await page.goto(root);

  // Click the get started link.
  
  await page.getByLabel("M2 Account Address").fill(moveAddress);
  const buttons = page.locator('button:has-text("Get MOVE")');
  await buttons.nth(1).click();
  const res = await page.waitForSelector('text=Funded account 1000 MOVE', {
    timeout : 10000
  });

  health_log({
    health_check: "fails-with-wrong-address",
    status: res ? "PASS" : "FAIL",
    reason: "faucet functional"
  })

  // Expects page to have a heading with the name of Installation.
  await expect(res).toBeDefined();
});