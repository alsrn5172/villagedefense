const { searchResources, getResource } = require('C:/Users/mingu/메월드폴더/.claude/skills/msw-search/scripts/msw_resource_api.cjs');

const items = [
  { query: '마나 엘릭서', expected: '마나 엘릭서' },
  { query: '맑은 물', expected: '맑은 물' },
  { query: '장어구이', expected: '장어구이' },
];

function normalize(value) {
  return String(value || '').replace(/\s+/g, '');
}

async function main() {
  for (const item of items) {
    const found = await searchResources(item.query, {
      resourceTypeFilter: ['sprite'],
      categoryFilter: ['item'],
      topK: 3,
    });
    const match = (found.results || []).find((resource) => {
      const names = (resource.names && resource.names.ko) || [];
      return names.some((name) => normalize(name) === normalize(item.expected));
    });
    if (!match) {
      throw new Error('No exact item-name match: ' + item.expected);
    }
    const detail = await getResource(match.id);
    const names = (detail.names && detail.names.ko) || [];
    if (detail.type !== 'sprite' || detail.category !== 'item'
        || !names.some((name) => normalize(name) === normalize(item.expected))) {
      throw new Error('Resource detail validation failed: ' + item.expected);
    }
    console.log(JSON.stringify({
      item: item.expected,
      type: detail.type,
      category: detail.category,
      matchedName: names.find((name) => normalize(name) === normalize(item.expected)),
      iconRuid: 'thumbnail://' + detail.id,
    }));
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
