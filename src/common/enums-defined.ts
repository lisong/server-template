export enum StatusEnum {
  NORMAL = 1,
  LOCK = 2,
  DELETE = 3,
}

export enum TwoStepEnabledEnum {
  NOT_YET = 0, // 未设置
  OPEN = 1, // 开启
  CLOSE = 2, // 关闭
}

export enum TwoStepMethodEnum {
  TOTP = 1, // TOTP验证
  EMAIL = 2, // 邮件验证
  SMS = 3, // 短信验证
}
