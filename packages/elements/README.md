# @duck_ui/elements

Web Components for DuckDB-WASM dashboards. No framework required — works with vanilla HTML, Vue, Svelte, Angular, or any framework.

## Install

```sh
npm install @duck_ui/elements @duckdb/duckdb-wasm
```

## Usage

```html
<script type="module">
  import { register } from '@duck_ui/elements'
  register()

  document.querySelector('duck-provider').load({
    sales: { url: '/data.parquet', format: 'parquet' }
  })
</script>

<duck-provider>
  <duck-dashboard columns="3" gap="16">
    <duck-panel>
      <duck-kpi sql="SELECT sum(total) as value FROM sales"
        label="Revenue" format="currency" currency="USD"></duck-kpi>
    </duck-panel>
    <duck-panel span="2">
      <duck-chart sql="SELECT month, sum(total) FROM sales GROUP BY 1"
        type="bar" height="300"></duck-chart>
    </duck-panel>
    <duck-panel span="3">
      <duck-table sql="SELECT * FROM sales" page-size="25" sortable></duck-table>
    </duck-panel>
  </duck-dashboard>
</duck-provider>
```

## Custom Elements

`<duck-provider>`, `<duck-chart>`, `<duck-table>`, `<duck-kpi>`, `<duck-dashboard>`, `<duck-panel>`, `<duck-filter-bar>`, `<duck-select-filter>`, `<duck-range-filter>`, `<duck-date-filter>`, `<duck-export>`

## Documentation

Full API reference: [docs/api/elements.md](https://github.com/caioricciuti/duck-ui-embed/blob/main/docs/api/elements.md)

## License

Apache-2.0
