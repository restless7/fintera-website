import fs from 'fs';
import path from 'path';
import { PrismaClient } from '../prisma/generated/client';

function ensureEnvLoaded(): void {
    if (process.env.FNT_NEXT_DATABASE_URL || process.env.fintera_DATABASE_URL) {
        return;
    }
    for (const envFile of ['.env.local', '.env']) {
        try {
            const fullPath = path.join(process.cwd(), envFile);
            if (fs.existsSync(fullPath)) {
                for (const line of fs.readFileSync(fullPath, 'utf8').split(/\r?\n/)) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed.startsWith('#')) continue;
                    const eqIdx = trimmed.indexOf('=');
                    if (eqIdx > 0) {
                        const key = trimmed.slice(0, eqIdx).trim();
                        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
                        if (!process.env[key]) {
                            process.env[key] = val;
                        }
                    }
                }
            }
        } catch {
            // Safe fallback
        }
    }
}

function resolveDatabaseUrl(): string | undefined {
    ensureEnvLoaded();
    const fntNext =
        process.env.FNT_NEXT_DATABASE_URL ||
        process.env.FNT_NEXT_POSTGRES_PRISMA_URL;
    if (fntNext) {
        return fntNext;
    }
    const primary = process.env.DATABASE_URL;
    if (primary && !primary.includes('localhost:5434')) {
        return primary;
    }
    return process.env.fintera_DATABASE_URL || primary;
}

const prismaClientSingleton = () => {
    const resolvedUrl = resolveDatabaseUrl();
    return new PrismaClient(
        resolvedUrl ? { datasources: { db: { url: resolvedUrl } } } : undefined
    );
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = prisma;
}
