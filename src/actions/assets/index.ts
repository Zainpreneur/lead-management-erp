'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/db';
import { assets, assetCategories, assetMaintenance, assetAssignments, expenses, people, purchaseOrders } from '@/db/schema';
import { eq, desc, and, or, ilike, sql, count } from 'drizzle-orm';
import { getUser, hasPermission } from '@/lib/auth';
import {
  createAssetSchema,
  updateAssetSchema,
  assetFiltersSchema,
  disposeAssetSchema,
  maintenanceSchema,
  type CreateAssetInput,
  type UpdateAssetInput,
  type AssetFilters,
  type DisposeAssetInput,
  type MaintenanceInput,
} from '@/lib/validations/assets';
import { generateReference } from '@/lib/utils';

export async function listAssets(filters: AssetFilters = { limit: 10, page: 1 }) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'assets:read')) {
    throw new Error('Unauthorized');
  }

  const validated = assetFiltersSchema.parse(filters);
  const { search, status, businessReference, vendorReference, limit = 10, page = 1 } = validated;

  const conditions = [];
  if (search) {
    conditions.push(or(
      ilike(assets.name, `%${search}%`),
      ilike(assets.reference, `%${search}%`),
      ilike(assets.serialNumber, `%${search}%`)
    )!);
  }
  if (status) conditions.push(eq(assets.status, status));
  if (businessReference) conditions.push(eq(assets.businessReference, businessReference));
  if (vendorReference) conditions.push(eq(assets.vendorReference, vendorReference));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, total] = await Promise.all([
    db
      .select({
        id: assets.id,
        reference: assets.reference,
        name: assets.name,
        categoryId: assets.categoryId,
        categoryName: assetCategories.name,
        status: assets.status,
        purchasePrice: assets.purchasePrice,
        currency: assets.currency,
        purchaseDate: assets.purchaseDate,
        purchaseOrderReference: assets.purchaseOrderReference,
        expenseReference: assets.expenseReference,
        serialNumber: assets.serialNumber,
        model: assets.model,
        manufacturer: assets.manufacturer,
        warrantyExpiry: assets.warrantyExpiry,
        assignedTo: assets.assignedTo,
        assignedToName: people.name,
        assignedBranch: assets.assignedBranch,
        businessReference: assets.businessReference,
        businessName: assets.businessName,
        location: assets.location,
        conditionRating: assets.conditionRating,
        notes: assets.notes,
        depreciationRate: assets.depreciationRate,
        depreciationMethod: assets.depreciationMethod,
        accumulatedDepreciation: assets.accumulatedDepreciation,
        bookValue: assets.bookValue,
        disposalDate: assets.disposalDate,
        disposalMethod: assets.disposalMethod,
        disposalProceeds: assets.disposalProceeds,
        disposalCost: assets.disposalCost,
        disposalNotes: assets.disposalNotes,
        vendorReference: assets.vendorReference,
        vendorName: assets.vendorName,
        createdAt: assets.createdAt,
        updatedAt: assets.updatedAt,
      })
      .from(assets)
      .leftJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
      .leftJoin(people, eq(assets.assignedTo, people.id))
      .where(where)
      .orderBy(desc(assets.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ count: count() }).from(assets).where(where),
  ]);

  return {
    assets: data,
    pagination: {
      page,
      limit,
      total: total[0]?.count || 0,
      totalPages: Math.ceil((total[0]?.count || 0) / limit),
    },
  };
}

export async function getAsset(reference: string) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'assets:read')) {
    throw new Error('Unauthorized');
  }

  const asset = await db
    .select({
      id: assets.id,
      reference: assets.reference,
      name: assets.name,
      categoryId: assets.categoryId,
      categoryName: assetCategories.name,
      status: assets.status,
      purchasePrice: assets.purchasePrice,
      currency: assets.currency,
      purchaseDate: assets.purchaseDate,
      purchaseOrderReference: assets.purchaseOrderReference,
      expenseReference: assets.expenseReference,
      serialNumber: assets.serialNumber,
      model: assets.model,
      manufacturer: assets.manufacturer,
      warrantyExpiry: assets.warrantyExpiry,
      assignedTo: assets.assignedTo,
      assignedToName: people.name,
      assignedBranch: assets.assignedBranch,
      businessReference: assets.businessReference,
      businessName: assets.businessName,
      location: assets.location,
      conditionRating: assets.conditionRating,
      notes: assets.notes,
      depreciationRate: assets.depreciationRate,
      depreciationMethod: assets.depreciationMethod,
      accumulatedDepreciation: assets.accumulatedDepreciation,
      bookValue: assets.bookValue,
      disposalDate: assets.disposalDate,
      disposalMethod: assets.disposalMethod,
      disposalProceeds: assets.disposalProceeds,
      disposalCost: assets.disposalCost,
      disposalNotes: assets.disposalNotes,
      vendorReference: assets.vendorReference,
      vendorName: assets.vendorName,
      createdAt: assets.createdAt,
      updatedAt: assets.updatedAt,
    })
    .from(assets)
    .leftJoin(assetCategories, eq(assets.categoryId, assetCategories.id))
    .leftJoin(people, eq(assets.assignedTo, people.id))
    .where(eq(assets.reference, reference))
    .limit(1);

  if (!asset[0]) throw new Error('Asset not found');

  // Get maintenance history
  const maintenance = await db
    .select()
    .from(assetMaintenance)
    .where(eq(assetMaintenance.assetId, asset[0].id))
    .orderBy(desc(assetMaintenance.performedOn));

  // Get assignments
  const assignments = await db
    .select()
    .from(assetAssignments)
    .where(eq(assetAssignments.assetId, asset[0].id))
    .orderBy(desc(assetAssignments.assignedFrom));

  return { asset: { ...asset[0], maintenance, assignments } };
}

export async function createAsset(input: CreateAssetInput) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'assets:write')) {
    throw new Error('Forbidden');
  }

  const validated = createAssetSchema.parse(input);
  const now = new Date().toISOString();
  const reference = await generateReference('AST');

  const bookValue = validated.purchasePrice || 0;

  const [newAsset] = await db
    .insert(assets)
    .values({
      reference,
      ...validated,
      bookValue,
      accumulatedDepreciation: 0,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  revalidatePath('/assets', 'page');
  revalidateTag('assets', 'page');

  return { asset: newAsset };
}

export async function updateAsset(reference: string, input: UpdateAssetInput) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'assets:write')) {
    throw new Error('Forbidden');
  }

  const validated = updateAssetSchema.parse(input);
  const now = new Date().toISOString();

  const existing = await db.select().from(assets).where(eq(assets.reference, reference)).limit(1);
  if (!existing[0]) throw new Error('Asset not found');

  const [updated] = await db
    .update(assets)
    .set({ ...validated, updatedAt: now })
    .where(eq(assets.reference, reference))
    .returning();

  revalidatePath('/assets', 'page');
  revalidatePath(`/assets/${reference}`, 'page');
  revalidateTag('assets', 'page');

  return { asset: updated };
}

export async function deleteAsset(reference: string) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'assets:write')) {
    throw new Error('Forbidden');
  }

  const existing = await db.select().from(assets).where(eq(assets.reference, reference)).limit(1);
  if (!existing[0]) throw new Error('Asset not found');

  // Delete related records first
  await db.delete(assetMaintenance).where(eq(assetMaintenance.assetId, existing[0].id));
  await db.delete(assetAssignments).where(eq(assetAssignments.assetId, existing[0].id));
  await db.delete(assets).where(eq(assets.reference, reference));

  revalidatePath('/assets', 'page');
  revalidateTag('assets', 'page');

  return { ok: true };
}

export async function disposeAsset(reference: string, input: DisposeAssetInput) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'assets:write')) {
    throw new Error('Forbidden');
  }

  const validated = disposeAssetSchema.parse(input);
  const asset = await db.select().from(assets).where(eq(assets.reference, reference)).limit(1);
  if (!asset[0]) throw new Error('Asset not found');

  if (!['deployed', 'maintaining'].includes(asset[0].status)) {
    throw new Error('Asset must be deployed or maintaining to dispose');
  }

  const now = new Date().toISOString();
  const proceeds = validated.disposalProceeds || 0;
  const cost = validated.disposalCost || 0;

  await db.transaction(async (tx) => {
    // Update asset
    await tx
      .update(assets)
      .set({
        status: 'disposed',
        disposalDate: validated.disposalDate,
        disposalMethod: validated.disposalMethod,
        disposalProceeds: proceeds,
        disposalCost: cost,
        disposalNotes: validated.disposalNotes,
        updatedAt: now,
      })
      .where(eq(assets.reference, reference));

    // Create disposal expense if there are costs
    if (cost > 0) {
      const expenseRef = await generateReference('EXP');
      await tx.insert(expenses).values({
        reference: expenseRef,
        title: `Disposal: ${asset[0].name}`,
        category: 'asset_disposal',
        amount: cost,
        currency: asset[0].currency,
        status: 'paid',
        expenseDate: validated.disposalDate,
        vendorReference: validated.disposalVendorRef,
        assetReference: asset[0].reference,
        assetCategory: 'disposal',
        isAssetPurchase: false,
        notes: validated.disposalNotes || `Disposal costs for ${asset[0].name}`,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Record disposal proceeds as income (negative expense)
    if (proceeds > 0) {
      const expenseRef = await generateReference('EXP');
      await tx.insert(expenses).values({
        reference: expenseRef,
        title: `Disposal Proceeds: ${asset[0].name}`,
        category: 'asset_disposal_proceeds',
        amount: -proceeds,
        currency: asset[0].currency,
        status: 'paid',
        expenseDate: validated.disposalDate,
        vendorReference: validated.disposalVendorRef,
        assetReference: asset[0].reference,
        assetCategory: 'disposal_proceeds',
        isAssetPurchase: false,
        notes: `Proceeds from ${validated.disposalMethod} of ${asset[0].name}`,
        createdAt: now,
        updatedAt: now,
      });
    }
  });

  revalidatePath('/assets', 'page');
  revalidatePath(`/assets/${reference}`, 'page');
  revalidateTag('assets', 'page');

  return { ok: true };
}

export async function createMaintenance(input: MaintenanceInput) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'assets:write')) {
    throw new Error('Forbidden');
  }

  const validated = maintenanceSchema.parse(input);
  const asset = await db.select().from(assets).where(eq(assets.reference, validated.assetReference)).limit(1);
  if (!asset[0]) throw new Error('Asset not found');

  const now = new Date().toISOString();

  await db.transaction(async (tx) => {
    // Create maintenance record
    await tx.insert(assetMaintenance).values({
      assetId: asset[0].id,
      maintenanceType: validated.maintenanceType,
      description: validated.description,
      cost: validated.cost,
      currency: validated.currency,
      expenseReference: validated.expenseReference,
      performedOn: validated.performedOn,
      performedBy: validated.performedBy,
      nextDue: validated.nextDue,
      notes: validated.notes,
      createdAt: now,
    });

    // Update asset status
    await tx
      .update(assets)
      .set({ status: 'maintaining', updatedAt: now })
      .where(eq(assets.reference, validated.assetReference));

    // Auto-create maintenance expense
    if (validated.cost > 0) {
      const expenseRef = await generateReference('EXP');
      await tx.insert(expenses).values({
        reference: expenseRef,
        title: `Maintenance: ${asset[0].name} - ${validated.maintenanceType}`,
        category: 'asset_maintenance',
        amount: validated.cost,
        currency: validated.currency,
        status: 'paid',
        expenseDate: validated.performedOn,
        vendorReference: null,
        assetReference: asset[0].reference,
        assetCategory: 'maintenance',
        isAssetPurchase: false,
        notes: validated.description,
        createdAt: now,
        updatedAt: now,
      });
    }
  });

  revalidatePath('/assets', 'page');
  revalidatePath(`/assets/${validated.assetReference}`);
  revalidateTag('assets', 'page');

  return { ok: true };
}

export async function deployAsset(reference: string, assignedTo: number | null, assignedBranch: string | null, reason: string) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'assets:write')) {
    throw new Error('Forbidden');
  }

  const asset = await db.select().from(assets).where(eq(assets.reference, reference)).limit(1);
  if (!asset[0]) throw new Error('Asset not found');
  if (asset[0].status !== 'acquired') throw new Error('Asset must be in acquired status to deploy');

  const now = new Date().toISOString();

  await db.transaction(async (tx) => {
    await tx
      .update(assets)
      .set({ status: 'deployed', assignedTo, assignedBranch, updatedAt: now })
      .where(eq(assets.reference, reference));

    await tx.insert(assetAssignments).values({
      assetId: asset[0].id,
      assignedTo,
      assignedBranch,
      assignedFrom: now,
      reason,
      createdAt: now,
    });
  });

  revalidatePath('/assets', 'page');
  revalidatePath(`/assets/${reference}`, 'page');
  revalidateTag('assets', 'page');

  return { ok: true };
}

export async function listAssetCategories() {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'assets:read')) {
    throw new Error('Unauthorized');
  }

  const categories = await db
    .select()
    .from(assetCategories)
    .where(eq(assetCategories.isArchived, false))
    .orderBy(assetCategories.name);

  return { categories };
}

export async function calculateAssetDepreciation(reference: string) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'assets:write')) {
    throw new Error('Forbidden');
  }

  const { calculateMonthlyDepreciation: calculateDep } = await import('@/lib/server/assets');
  const asset = await db.select().from(assets).where(eq(assets.reference, reference)).limit(1);
  if (!asset[0]) throw new Error('Asset not found');

  const monthlyDepreciation = calculateDep({
    id: asset[0].id,
    reference: asset[0].reference,
    name: asset[0].name,
    status: asset[0].status,
    purchasePrice: asset[0].purchasePrice,
    currency: asset[0].currency,
    depreciationRate: asset[0].depreciationRate,
    depreciationMethod: asset[0].depreciationMethod,
    accumulatedDepreciation: asset[0].accumulatedDepreciation,
    bookValue: asset[0].bookValue,
  } as any);

  const newAccumulated = (asset[0].accumulatedDepreciation || 0) + monthlyDepreciation;
  const newBookValue = Math.max(0, asset[0].purchasePrice - newAccumulated);

  await db.transaction(async (tx) => {
    await tx
      .update(assets)
      .set({
        accumulatedDepreciation: newAccumulated,
        bookValue: newBookValue,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(assets.reference, reference));

    // Create depreciation expense
    const expenseRef = await generateReference('EXP');
    await tx.insert(expenses).values({
      reference: expenseRef,
      title: `Depreciation: ${asset[0].name}`,
      category: 'asset_depreciation',
      amount: monthlyDepreciation,
      currency: asset[0].currency,
      status: 'paid',
      expenseDate: new Date().toISOString().slice(0, 10),
      vendorReference: null,
      assetReference: asset[0].reference,
      assetCategory: 'depreciation',
      isAssetPurchase: false,
      notes: `Monthly depreciation (${asset[0].depreciationRate}%/yr, ${asset[0].depreciationMethod})`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  revalidatePath('/assets', 'page');
  revalidatePath(`/assets/${reference}`);
  revalidateTag('assets', 'page');

  return { monthlyDepreciation, newAccumulated, newBookValue };
}

export async function calculateAllAssetDepreciation() {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'assets:write')) {
    throw new Error('Forbidden');
  }

  const { calculateAllDepreciation: calculateAllDep } = await import('@/lib/server/assets');
  const result = calculateAllDep();

  revalidatePath('/assets', 'page');
  revalidateTag('assets', 'page');

  return result;
}

async function getUserRequest() {
  return { id: 1, name: 'System', role: 'admin', team: null };
}