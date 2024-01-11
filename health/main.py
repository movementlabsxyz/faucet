import asyncio
from playwright.async_api import async_playwright, Browser

def health_log(*, 
    health_check : str, 
    passed : bool,
    reason : str,
    group : str = "movement-faucet",
):
    passed = "PASS" if passed else "FAIL"
    print(f"health_check=\"{health_check}\", passed=\"{passed}\", reason=\"{reason}\", group=\"{group}\"")

async def check_title(browser : Browser):
    page = await browser.new_page()
    await page.goto("https://faucet.movementlabs.xyz")
    title = await page.title()
    passed = title == "Movement Faucet"
    health_log(
        health_check="faucet-title",
        passed=passed,
        reason="Faucet title must be \"Movement Faucet\""
    )
    
async def fails_without_address(browser : Browser):
    page = await browser.new_page()
    await page.goto("https://faucet.movementlabs.xyz")
    await page.click("text=Get MOV")
    res = await page.wait_for_selector(
        "text=Request failed with status code 404",
        timeout=1000
    )
    passed = res is not None
    health_log(
        health_check="faucet-fails-without-address",
        passed=passed,
        reason="Faucet must fail without address"
    )
    
    
async def all(browser : Browser):
    await asyncio.gather(
        check_title(browser),
        fails_without_address(browser)
    )

async def main():
    async with async_playwright() as p:
        
        # launch all browsers
        chromium = await p.chromium.launch()
        firefox = await p.firefox.launch()
        safari = await p.webkit.launch()
        
        await asyncio.gather(
            all(chromium),
            all(firefox),
            all(safari)
        )
        
        # close all browsers
        await chromium.close()
        await firefox.close()
        await safari.close()

asyncio.run(main())