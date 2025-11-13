const db = require("../db");

db.run(
  `DELETE FROM translations WHERE TRIM(COALESCE(value, '')) = ''`,
  [],
  function (err) {
    if (err) {
      console.error("❌ Cleanup failed:", err.message);
      process.exit(1);
    }
    console.log(`✅ Cleanup done. Deleted rows: ${this.changes}`);
    process.exit(0);
  }
);
