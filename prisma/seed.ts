// Catalog/content seed data — populated in Phase 2 once the category/product
// admin flows exist. Kept as an empty, runnable entry point now so
// `npx prisma db seed` works from day one (see package.json's prisma.seed
// config once added in Phase 2).
async function main() {
  console.log("No seed data yet — Phase 2.");
}

main();
