import { EQUIPMENT, getEquipment, sandCapacityCost } from '../game/engine.js'

export default function ShopModal({ state, onBuyEquipment, onBuyCapacity, onClose }) {
  const { progress } = state
  const current = getEquipment(progress.equipmentLevel)
  const nextEq = progress.equipmentLevel < EQUIPMENT.length ? EQUIPMENT[progress.equipmentLevel] : null
  const capCost = sandCapacityCost(progress.sandCapacity)

  return (
    <div className="modal-backdrop">
      <div className="modal shop-modal">
        <header className="modal-header">
          <div>
            <h2>Island Shop</h2>
            <p className="muted">Coins: {formatMoney(progress.money)}</p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Leave Shop
          </button>
        </header>

        <section className="shop-section">
          <h3>Digging Equipment</h3>
          <div className="shop-current">
            Current: <strong>{current.name}</strong> · Dig time {current.digTime.toFixed(1)}s
          </div>
          <div className="shop-list">
            {EQUIPMENT.map((eq) => {
              const owned = progress.equipmentLevel >= eq.id
              const isNext = nextEq && nextEq.id === eq.id
              const locked = !owned && !isNext
              return (
                <div key={eq.id} className={`shop-item ${owned ? 'owned' : ''} ${isNext ? 'next' : ''}`}>
                  <div>
                    <strong>{eq.name}</strong>
                    <div className="muted">Dig Time: {eq.digTime.toFixed(1)}s</div>
                  </div>
                  <div className="shop-item-action">
                    {owned ? (
                      <span className="badge">OWNED</span>
                    ) : locked ? (
                      <span className="badge muted-badge">LOCKED</span>
                    ) : (
                      <>
                        <span>🪙 {eq.cost}</span>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={onBuyEquipment}
                          disabled={progress.money < eq.cost}
                        >
                          Buy
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <section className="shop-section">
          <h3>Sand Capacity</h3>
          <div className="shop-item next">
            <div>
              <strong>Carry Capacity +1</strong>
              <div className="muted">
                Current: {progress.sandCapacity} → {progress.sandCapacity + 1}
              </div>
            </div>
            <div className="shop-item-action">
              <span>🪙 {capCost}</span>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={onBuyCapacity}
                disabled={progress.money < capCost}
              >
                Upgrade
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function formatMoney(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}
