import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { motion } from "framer-motion";

interface SliderFieldProps<T extends FieldValues> {
    label: string;
    name: Path<T>;
    control: Control<T>;
    min?: number;
    max?: number;
    step?: number;
    error?: string;
    required?: boolean;
    formatCurrency?: boolean;
}

export function SliderField<T extends FieldValues>({
    label,
    name,
    control,
    min = 0,
    max = 100000000,
    step = 100000,
    error,
    required = false,
    formatCurrency = true,
}: SliderFieldProps<T>) {
    const formatValue = (value: number) => {
        if (!formatCurrency) return value;
        return new Intl.NumberFormat("es-CO", {
            style: "currency",
            currency: "COP",
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <Controller
            name={name}
            control={control}
            render={({ field: { onChange, value } }) => {
                const currentValue = Number(value) || 0;

                return (
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <label className="block text-sm font-medium text-gray-700">
                                {label} {required && <span className="text-red-500">*</span>}
                            </label>
                            <div className="text-lg font-bold text-blue-600">
                                {formatValue(currentValue)}
                            </div>
                        </div>

                        <div className="relative h-2 bg-gray-200 rounded-full">
                            <motion.div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                                style={{
                                    width: `${Math.min(((currentValue - min) / (max - min)) * 100, 100)}%`,
                                }}
                            />
                            <input
                                type="range"
                                min={min}
                                max={max}
                                step={step}
                                value={currentValue}
                                onChange={(e) => onChange(Number(e.target.value))}
                                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div
                                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-md pointer-events-none transition-all"
                                style={{
                                    left: `${Math.min(((currentValue - min) / (max - min)) * 100, 100)}%`,
                                    transform: `translate(-50%, -50%)`,
                                }}
                            />
                        </div>

                        <div className="flex justify-between text-xs text-gray-400">
                            <span>{formatValue(min)}</span>
                            <span>{formatValue(max)}+</span>
                        </div>

                        {/* Manual Input Fallback */}
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                value={value || ""}
                                onChange={(e) => onChange(e.target.valueAsNumber)}
                                className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                                placeholder="Ingrese valor exacto"
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-500 mt-1 animate-pulse">
                                {error}
                            </p>
                        )}
                    </div>
                );
            }}
        />
    );
}
