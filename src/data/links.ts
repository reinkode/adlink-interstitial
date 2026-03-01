export interface LinkConfig {
  id: string;
  smartLinkUrl: string;
  destinationUrl: string;
  timerSeconds: number;
  adTitle?: string;
}

export const links: Record<string, LinkConfig> = {
  "1": {
    "id": "1",
    "smartLinkUrl": "https://www.google.com", 
    "destinationUrl": "https://example.com",
    "timerSeconds": 5,
    "adTitle": "Sponsored Content"
  },
  "demo": {
    "id": "demo",
    "smartLinkUrl": "https://bing.com",
    "destinationUrl": "https://wikipedia.org",
    "timerSeconds": 10,
    "adTitle": "Advertisement"
  }
};
