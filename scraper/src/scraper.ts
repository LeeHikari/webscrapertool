import { webkit } from 'playwright'
import { LGAEvent } from './common/types'
import { exportToJson, uploadToCloud } from './common/utils'
import { scrapeParramatta } from './LGAs/parramatta'
import ora from 'ora'
import chalk from 'chalk'
import { scrapeCampbelltown } from './LGAs/campbelltown'

export async function start(): Promise<void> {
  const launchingBrowser = ora('Launching browser').start()

  try {
    const browser = await webkit.launch()
    const context = await browser.newContext()

    launchingBrowser.succeed(
      chalk.yellow.inverse('Browser launched successfully')
    )

    const promises = Promise.all([
      scrapeParramatta(await context.newPage()),
      scrapeCampbelltown(await context.newPage()),
    ])

    const events: LGAEvent[] = (await promises)
      .flat()
      .sort((currentEvent, nextEvent) => {
        return currentEvent.startDate.getTime() - nextEvent.startDate.getTime()
      })

    const mode = process.argv[2]
    if (mode === '--cloud') {
      await exportToJson(events)
      await uploadToCloud()
    } else {
      await exportToJson(events, { pretty: true })
    }

    await browser.close()
    launchingBrowser.succeed(chalk.yellow.inverse('Scraping finished'))
  } catch (error) {
    launchingBrowser.fail(chalk.red(`Error occurred in start() - ${error}`))
  }
}

start()
