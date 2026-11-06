// ============================================================
// 数据源诚实性判定（纯函数，无依赖，可单测）
// ============================================================
// getLeads / getOrders / getFollowupTasks 在飞书不可用（凭证失效 /
// 表缺失 / 请求失败）时会回退 mock 数据并标 source: 'mock'。
// mock 数据不能冒充真数据：周报推送、通知铃铛这类对外出口必须
// 先用本模块判定，任一源为 mock 就跳过推送 / 显示异常态，
// 而不是把假 GMV、假 0 推给运营。
// ============================================================

export type DataSource = 'feishu' | 'mock';

/** 任一数据源为 mock 即返回 true（用于跳过推送 / 显示数据源异常态）。 */
export function isAnySourceMock(...sources: Array<DataSource | undefined | null>): boolean {
  return sources.some((source) => source === 'mock');
}

/**
 * 合并多个上游数据源标记：任一 mock → mock。
 * 用于跨源推导结果的可信度标记（如待跟进任务 = leads + followups 两源推导，
 * followups 表挂了而 leads 正常时，合并结果必须标 mock，否则假待办会被
 * 周报 / 通知铃铛当真数据推出去）。
 */
export function mergeSources(...sources: Array<DataSource | undefined | null>): DataSource {
  return isAnySourceMock(...sources) ? 'mock' : 'feishu';
}
