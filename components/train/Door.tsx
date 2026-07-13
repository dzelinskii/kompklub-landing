/** Декоративная дверь-переход между вагонами. */
export function Door({ open }: { open: boolean }) {
  return (
    <div aria-hidden="true" className={`train-door${open ? " train-door--open" : ""}`}>
      <span className="train-door__leaf train-door__leaf--left" />
      <span className="train-door__leaf train-door__leaf--right" />
    </div>
  );
}
