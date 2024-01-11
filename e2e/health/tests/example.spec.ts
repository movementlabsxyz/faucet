import { test, expect } from '@playwright/test';

function health_log({
  health_check,
  status,
  group = "movement-faucet",
  reason
} : {
  health_check : string,
  status : "PASS" | "FAIL",
  group ? : string,
  reason : string
}){

  console.log(
    `health_check="${health_check}" status="${status}" group="${group}" reason="${reason}""`
  )

}

test('has title', async ({ page }) => {
  await page.goto('https://faucet.movementlabs.xyz/');

  const title = await page.title();
  health_log({
    health_check: "has-title",
    status: title === "Movement Faucet" ? "PASS" : "FAIL",
    reason: "title is present"
  })

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Movement Faucet/);

});

test('fails when ', async ({ page }) => {
  await page.goto('https://faucet.movementlabs.xyz/');

  // Click the get started link.
  await page.click('text=Get MOV');
  const res = await page.waitForSelector('text=Request failed with status code 404', {
    timeout : 1000
  });

  health_log({
    health_check: "fails-without-address",
    status: res ? "PASS" : "FAIL",
    reason: "get started link is present"
  })

  // Expects page to have a heading with the name of Installation.
  await expect(res).toBeDefined();

});
