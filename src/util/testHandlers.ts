import { AxiosResponse } from "axios"
import {Handler} from "./discord"

export const testHandler: Handler = {
  post: (url, data, headers) => ({
      headers: {
          'x-ratelimit-bucket': 'db18a1c09af2e1661654351fbf0faf15',
          'x-ratelimit-limit': '5',
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': '1650672594.213',
          'x-ratelimit-reset-after': '5.000',
      },
      data: {},
      config: {},
      status: 200,
      statusText: 'OK',
  } as AxiosResponse),
  get: (url, headers) => ({
      headers: {
          'x-ratelimit-bucket': 'db18a1c09af2e1661654351fbf0faf15',
          'x-ratelimit-limit': '5',
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': '1650672594.213',
          'x-ratelimit-reset-after': '5.000',
      },
      data: {},
      config: {},
      status: 200,
      statusText: 'OK',
  } as AxiosResponse),
  delete: (url, headers) => ({
      headers: {
          'x-ratelimit-bucket': 'db18a1c09af2e1661654351fbf0faf15',
          'x-ratelimit-limit': '5',
          'x-ratelimit-remaining': '0',
          'x-ratelimit-reset': '1650672594.213',
          'x-ratelimit-reset-after': '5.000',
      },
      data: {},
      config: {},
      status: 200,
      statusText: 'OK',
  } as AxiosResponse)
}
