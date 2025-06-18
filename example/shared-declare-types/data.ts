export interface Data<T extends string> {
    key: string;
    value: string;
    timestamp: number;
    description?: T; // 可選屬性
}

