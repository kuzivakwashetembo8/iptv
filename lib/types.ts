export interface Channel {
  id: number
  name: string
  url: string
  logo: string
  category: string
  categories: string[]
  country: string
  countryName: string
  flag: string
}

export interface CategoryFacet {
  name: string
  count: number
}

export interface CountryFacet {
  code: string
  name: string
  flag: string
  count: number
}

export interface Meta {
  total: number
  categories: CategoryFacet[]
  countries: CountryFacet[]
  generatedAt: string
}

export interface ChannelsResponse {
  channels: Channel[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
