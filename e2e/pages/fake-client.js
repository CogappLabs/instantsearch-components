// A search client answering every query with one made-up year facet, and
// recording each query's numeric filters for the tests to read.
window.searches = [];
const counts = { "-500": 2 };
for (let y = 1600; y <= 2020; y++) counts[y] = 5 + (y % 7);
const years = Object.keys(counts).map(Number);
window.fakeClient = {
  search: async (requests) => {
    window.searches.push(...requests.map((r) => r.params?.numericFilters ?? []));
    window.facetSearches = (window.facetSearches ?? []).concat(
      requests.map((r) => JSON.stringify(r.params?.facetFilters ?? [])),
    );
    return {
      results: requests.map(() => ({
        hits: [],
        nbHits: 0,
        page: 0,
        nbPages: 0,
        hitsPerPage: 0,
        processingTimeMS: 1,
        exhaustiveNbHits: true,
        query: "",
        params: "",
        facets: { year: counts, hasImage: { 1: 1234, 0: 56 } },
        facets_stats: {
          year: { min: Math.min(...years), max: Math.max(...years), avg: 0, sum: 0 },
        },
      })),
    };
  },
};
