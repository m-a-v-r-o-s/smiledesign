// Renders an `info` field's body: paragraphs, { h } headings and { ul } lists.
export default function Legal({ blocks }) {
  return (
    <div className="legal">
      {blocks.map((b, i) =>
        typeof b === 'string' ? <p key={i}>{b}</p> :
        b.h ? <h3 key={i}>{b.h}</h3> :
        <ul key={i}>{b.ul.map((li, j) => <li key={j}>{li}</li>)}</ul>)}
    </div>
  )
}
