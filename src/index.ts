
import express, { Express, Request, Response } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { object, string, number, bool, ValidationError } from "yup";
import puppeteer, { Browser, Page } from 'puppeteer';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

let browser: Browser | null = null;

const bodySchema = object({
  name: string().required(),
  day: number().required().min(1).max(31),
  month: number().required().min(1).max(12),
  year: number().required().min(1911),
  hour: number().required().min(0).max(23),
  minute: number().required().min(0).max(59),
  gender: bool().required(),
  viewYear: number().required().min(1911),
  viewMonth: number().required().min(1).max(12),
});

async function initializeBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  }
  return browser;
}

async function fillFormAndSubmit(page: Page, formData: any): Promise<string | null> {
  try {
    await page.goto("https://tuvi.vn/lap-la-so-tu-vi", { waitUntil: 'networkidle2' });

    await page.locator('input[name="name"]').fill(formData.name);
    await page.select('select[name="dayOfDOB"]', formData.day.toString());
    await page.select('select[name="monthOfDOB"]', formData.month.toString());
    await page.locator('input[name="yearOfDOB"]').fill(formData.year.toString());
    await page.select('select[name="hourOfDOB"]', formData.hour.toString());
    await page.select('select[name="minOfDOB"]', formData.minute.toString());

    formData.gender
      ? await page.locator("#male2Res").click()
      : await page.locator("#female2Res").click();

    await page.select('select[name="viewYear"]', formData.viewYear.toString());
    await page.select('select[name="viewMonth"]', formData.viewMonth.toString());
    await page.locator('button[type="submit"]').click();

    await page.waitForSelector("#content-la-so", { timeout: 10000 });
    return await page.evaluate(() => document.querySelector('#content-la-so')?.outerHTML || null);
  } catch (error) {
    console.error("Error filling form and submitting:", error);
    return null;
  } finally {
    await page.close();
  }
}

app.post("/api/tuvi", async (req: Request, res: Response) => {
  try {
    await bodySchema.validate(req.body, { abortEarly: false });

    const browser = await initializeBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 })
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      if (request.resourceType() === "image") {
        request.abort();
      } else {
        request.continue();
      }
    });

    const result = await fillFormAndSubmit(page, req.body);

    if (result) {
      res.json({ html: result });
    } else {
      res.status(500).json({ error: "Failed to retrieve content." });
    }
  } catch (error) {
    if (error instanceof ValidationError) {
      const errors: Record<string, string> = {};
      error.inner.forEach(err => {
        if (err.path) {
          errors[err.path] = err.message;
        }
      });
      res.status(400).json(errors);
    } else {
      console.error("Unexpected error:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
