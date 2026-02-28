# @duck_ui/cdn

Pre-bundled script for CDN usage. One `<script>` tag gives you DuckDB-WASM dashboards with zero build step.

## Usage

```html
<script src="https://unpkg.com/@duck_ui/cdn/dist/duck-ui.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm/dist/duckdb-browser-blocking.js"></script>

<duck-provider id="app">
  <duck-chart sql="SELECT category, sum(amount) FROM sales GROUP BY 1"
    type="bar" height="300"></duck-chart>
  <duck-table sql="SELECT * FROM sales" page-size="20" sortable></duck-table>
</duck-provider>

<script>
  document.getElementById('app').load({
    sales: { url: '/sales.parquet', format: 'parquet' }
  })
</script>
```

All custom elements are auto-registered on load. The `DuckUI` core class is available as `window.DuckUI.DuckUI`.

## Documentation

Full guide: [docs/api/elements.md](https://github.com/caioricciuti/duck-ui-embed/blob/main/docs/api/elements.md)

## License

Apache-2.0
