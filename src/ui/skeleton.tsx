function Skeleton({ lines = 1 }: { lines?: number }) {
  return (
    <div className="ui-skeleton" aria-hidden="true">
      {Array.from({ length: lines }, (_unused, line) => (
        <span key={line} />
      ))}
    </div>
  )
}

export { Skeleton }
