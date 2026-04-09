import { DEF_META, UPGRADES, getUpgradeCost, getSellPrice, getRepairActionState } from '../data/units.js';

export default function ContextMenu({ target, money, waveActive, repairDiscount = 0, onSell, onUpgrade, onRepair, onClose }) {
  if (!target) return null;

  const isTower = target.type === 'tower';
  const isBuilding = target.type === 'building';
  const item = target.item;

  // Clamp to viewport bounds
  const menuW = 200, menuH = 200;
  const x = Math.min(target.screenX, window.innerWidth - menuW / 2 - 8);
  const y = Math.max(target.screenY, menuH + 16);

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 99 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed', left: x, top: y, zIndex: 100,
          transform: 'translate(-50%, -100%)', marginTop: -8,
        }}
      >
        <div style={{
          background: '#0c1222ee', border: '1px solid #334155',
          borderRadius: 10, padding: '12px 14px', minWidth: 200,
          backdropFilter: 'blur(8px)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}>
          {isTower && <TowerMenu item={item} money={money} waveActive={waveActive} repairDiscount={repairDiscount} onSell={onSell} onUpgrade={onUpgrade} onRepair={onRepair} />}
          {isBuilding && <BuildingMenu item={item} money={money} waveActive={waveActive} repairDiscount={repairDiscount} onRepair={onRepair} />}
        </div>
      </div>
    </div>
  );
}

function TowerMenu({ item, money, waveActive, repairDiscount, onSell, onUpgrade, onRepair }) {
  const meta = DEF_META[item.type];
  const level = item.level || 0;
  const maxLevel = UPGRADES[item.type]?.length - 1 || 0;
  const canUpgrade = level < maxLevel;
  const upgradeCost = canUpgrade ? getUpgradeCost(item, item._mode) : null;
  const sellPrice = getSellPrice(item);
  const repairState = getRepairActionState(item, { waveActive, repairDiscount });

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 800, color: meta.color, marginBottom: 2 }}>
        {meta.emoji} "{item.callsign || '???'}"
      </div>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
        {meta.name} {item.type !== 'decoy' ? `· Рів.${level + 1}/${maxLevel + 1}` : ''}
      </div>

      <div className="font-mono" style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 10, lineHeight: 1.6 }}>
        {item.type !== 'decoy' ? (
          <>HP: {item.hp}/{item.maxHp} · 🎯{Math.round((item.hitChance || 0) * 100)}% · ⚡{item.damage} · 💀{item.kills || 0}</>
        ) : (
          <>HP: {item.hp}/{item.maxHp} · 🪤 Приманка</>
        )}
      </div>

      {repairState.damaged && (
        <button
          onClick={() => onRepair(item)}
          disabled={money < repairState.cost}
          style={{
            display: 'block', width: '100%',
            padding: '8px 10px', fontSize: 13, fontWeight: 700,
            background: money >= repairState.cost ? '#38bdf820' : '#1e293b',
            color: money >= repairState.cost ? '#38bdf8' : '#64748b',
            border: `1px solid ${money >= repairState.cost ? '#38bdf844' : '#1e293b'}`,
            borderRadius: 6, marginBottom: 4, minHeight: 44,
          }}
        >
          🔧 Ремонт — 💰{repairState.cost} (+{repairState.amount} HP)
          {waveActive && <div style={{ fontSize: 11, color: '#7dd3fc', marginTop: 2 }}>Польовий ремонт доступний під час хвилі</div>}
        </button>
      )}

      {canUpgrade && (
        <button
          onClick={() => onUpgrade(item)}
          disabled={money < upgradeCost || waveActive}
          style={{
            display: 'block', width: '100%',
            padding: '8px 10px', fontSize: 13, fontWeight: 700,
            background: money >= upgradeCost && !waveActive ? '#4ade8020' : '#1e293b',
            color: money >= upgradeCost && !waveActive ? '#4ade80' : '#64748b',
            border: `1px solid ${money >= upgradeCost && !waveActive ? '#4ade8044' : '#1e293b'}`,
            borderRadius: 6, marginBottom: 4, minHeight: 44,
          }}
        >
          ⬆ Апгрейд — 💰{upgradeCost}
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
            {UPGRADES[item.type][level + 1]?.desc}
          </div>
          {waveActive && <div style={{ fontSize: 11, color: '#f59e0b' }}>Тільки між хвилями</div>}
        </button>
      )}

      <button
        onClick={() => onSell(item)}
        style={{
          display: 'block', width: '100%',
          padding: '8px 10px', fontSize: 13, fontWeight: 700,
          background: '#ef444418', color: '#ef4444',
          border: '1px solid #ef444433', borderRadius: 6, minHeight: 44,
        }}
      >
        💰 Продати (+{sellPrice})
      </button>
    </div>
  );
}

function BuildingMenu({ item, money, waveActive, repairDiscount, onRepair }) {
  const repairState = getRepairActionState(item, { waveActive, repairDiscount });

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 800, color: item.hp > 0 ? '#4ade80' : '#ef4444', marginBottom: 2 }}>
        {item.emoji} {item.name}
      </div>
      <div className="font-mono" style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 4 }}>
        HP: {item.hp}/{item.maxHp}
      </div>
      {item.bonus && (
        <div style={{ fontSize: 11, color: item.hp > 0 ? '#fbbf24' : '#64748b', marginBottom: 8 }}>
          {item.hp > 0 ? '✓' : '✗'} {item.bonus.desc}
        </div>
      )}

      {repairState.damaged && (
        <button
          onClick={() => onRepair(item)}
          disabled={money < repairState.cost || !repairState.allowed}
          style={{
            display: 'block', width: '100%',
            padding: '8px 10px', fontSize: 13, fontWeight: 700,
            background: money >= repairState.cost && repairState.allowed ? '#4ade8020' : '#1e293b',
            color: money >= repairState.cost && repairState.allowed ? '#4ade80' : '#64748b',
            border: `1px solid ${money >= repairState.cost && repairState.allowed ? '#4ade8044' : '#1e293b'}`,
            borderRadius: 6, minHeight: 44,
          }}
        >
          🔧 Ремонт — 💰{repairState.cost} (+{repairState.amount} HP)
          {repairState.reason === 'betweenWaves' && <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 2 }}>Тільки між хвилями</div>}
        </button>
      )}

      {item.hp <= 0 && (
        <div style={{ fontSize: 12, color: '#7f1d1d' }}>Знищено. Ремонт неможливий.</div>
      )}

      {!repairState.damaged && item.hp > 0 && (
        <div style={{ fontSize: 12, color: '#4ade80' }}>Стан: повний</div>
      )}
    </div>
  );
}
