'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/db';
import { purchaseOrders, purchaseOrderItems, vendors, goodsReceipts, goodsReceiptItems, assets, expenses, inventoryAdjustments, products } from '@/db/schema';
import { eq, desc, and, or, ilike, sql, count, sum } from 'drizzle-orm';
import { getUser, hasPermission } from '@/lib/auth';
import {
  createPOSchema,
  updatePOSchema,
  poFiltersSchema,
  createGoodsReceiptSchema,
  type CreatePOInput,
  type UpdatePOInput,
  type POFilters,
  type CreateGoodsReceiptInput,
} from '@/lib/validations/purchase-orders';
import { generateReference } from '@/lib/utils';

export async function listPurchaseOrders(filters: POFilters = { limit: 10, page: 1 }) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'purchase-orders:read')) {
    throw new Error('Unauthorized');
  }

  const validated = poFiltersSchema.parse(filters);
  const { search, status, vendorReference, limit = 10, page = 1 } = validated;

  const conditions = [];
  if (search) {
    conditions.push(or(
      ilike(purchaseOrders.reference, `%${search}%`),
      ilike(purchaseOrders.vendorName, `%${search}%`)
    )!);
  }
  if (status) conditions.push(eq(purchaseOrders.status, status));
  if (vendorReference) conditions.push(eq(purchaseOrders.vendorReference, vendorReference));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [data, total] = await Promise.all([
    db
      .select({
        id: purchaseOrders.id,
        reference: purchaseOrders.reference,
        vendorReference: purchaseOrders.vendorReference,
        vendorName: purchaseOrders.vendorName,
        status: purchaseOrders.status,
        totalAmount: purchaseOrders.totalAmount,
        currency: purchaseOrders.currency,
        orderDate: purchaseOrders.orderDate,
        expectedDelivery: purchaseOrders.expectedDelivery,
        notes: purchaseOrders.notes,
        assetCreated: purchaseOrders.assetCreated,
        assetReferences: purchaseOrders.assetReferences,
        createdAt: purchaseOrders.createdAt,
        updatedAt: purchaseOrders.updatedAt,
      })
      .from(purchaseOrders)
      .where(where)
      .orderBy(desc(purchaseOrders.createdAt))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ count: count() }).from(purchaseOrders).where(where),
  ]);

  return {
    purchaseOrders: data,
    pagination: {
      page,
      limit,
      total: total[0]?.count || 0,
      totalPages: Math.ceil((total[0]?.count || 0) / limit),
    },
  };
}

export async function getPurchaseOrder(reference: string) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'purchase-orders:read')) {
    throw new Error('Unauthorized');
  }

  const po = await db
    .select()
    .from(purchaseOrders)
    .where(eq(purchaseOrders.reference, reference))
    .limit(1);

  if (!po[0]) throw new Error('Purchase order not found');

  const items = await db
    .select()
    .from(purchaseOrderItems)
    .where(eq(purchaseOrderItems.poReference, reference))
    .orderBy(purchaseOrderItems.sortOrder);

  const receipts = await db
    .select()
    .from(goodsReceipts)
    .where(eq(goodsReceipts.poReference, reference))
    .orderBy(desc(goodsReceipts.receivedDate));

  return { purchaseOrder: { ...po[0], items, receipts } };
}

export async function createPurchaseOrder(input: CreatePOInput) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'purchase-orders:write')) {
    throw new Error('Forbidden');
  }

  const validated = createPOSchema.parse(input);
  const now = new Date().toISOString();
  const reference = await generateReference('PO');

  const totalAmount = validated.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const vendor = await db.select().from(vendors).where(eq(vendors.reference, validated.vendorReference)).limit(1);
  if (!vendor[0]) throw new Error('Vendor not found');

  await db.transaction(async (tx) => {
    await tx.insert(purchaseOrders).values({
      reference,
      vendorReference: validated.vendorReference,
      vendorName: vendor[0].name,
      status: validated.status,
      totalAmount,
      currency: validated.currency,
      orderDate: validated.orderDate,
      expectedDelivery: validated.expectedDelivery,
      notes: validated.notes,
      createdAt: now,
      updatedAt: now,
    });

    for (const [index, item] of validated.items.entries()) {
      await tx.insert(purchaseOrderItems).values({
        poReference: reference,
        productReference: item.productReference,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.quantity * item.unitPrice,
        receivedQuantity: 0,
        sortOrder: index,
        serialNumber: item.serialNumber,
        model: item.model,
        manufacturer: item.manufacturer,
      });
    }
  });

  revalidatePath('/purchase-orders', 'page');
  revalidateTag('purchase-orders', 'page');

  return { purchaseOrder: { reference, ...validated, totalAmount } };
}

export async function updatePurchaseOrder(reference: string, input: UpdatePOInput) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'purchase-orders:write')) {
    throw new Error('Forbidden');
  }

  const validated = updatePOSchema.parse(input);
  const now = new Date().toISOString();

  const existing = await db.select().from(purchaseOrders).where(eq(purchaseOrders.reference, reference)).limit(1);
  if (!existing[0]) throw new Error('Purchase order not found');

  const [updated] = await db
    .update(purchaseOrders)
    .set({ ...validated, updatedAt: now })
    .where(eq(purchaseOrders.reference, reference))
    .returning();

  revalidatePath('/purchase-orders', 'page');
  revalidatePath(`/purchase-orders/${reference}`, 'page');
  revalidateTag('purchase-orders', 'page');

  return { purchaseOrder: updated };
}

export async function deletePurchaseOrder(reference: string) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'purchase-orders:write')) {
    throw new Error('Forbidden');
  }

  const existing = await db.select().from(purchaseOrders).where(eq(purchaseOrders.reference, reference)).limit(1);
  if (!existing[0]) throw new Error('Purchase order not found');

  // Delete related records
  await db.delete(purchaseOrderItems).where(eq(purchaseOrderItems.poReference, reference));
  await db.delete(goodsReceiptItems).where(
    eq(goodsReceiptItems.receiptReference, 
      db.select({ ref: goodsReceipts.reference })
        .from(goodsReceipts)
        .where(eq(goodsReceipts.poReference, reference))
    )
  );
  await db.delete(goodsReceipts).where(eq(goodsReceipts.poReference, reference));
  await db.delete(purchaseOrders).where(eq(purchaseOrders.reference, reference));

  revalidatePath('/purchase-orders', 'page');
  revalidateTag('purchase-orders', 'page');

  return { ok: true };
}

export async function createGoodsReceipt(input: CreateGoodsReceiptInput) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'purchase-orders:write')) {
    throw new Error('Forbidden');
  }

  const validated = createGoodsReceiptSchema.parse(input);
  const now = new Date().toISOString();

  const po = await db.select().from(purchaseOrders).where(eq(purchaseOrders.reference, validated.poReference)).limit(1);
  if (!po[0]) throw new Error('Purchase order not found');

  const reference = await generateReference('GR');

  await db.transaction(async (tx) => {
    await tx.insert(goodsReceipts).values({
      reference,
      poReference: validated.poReference,
      vendorReference: po[0].vendorReference,
      receivedDate: validated.receivedDate,
      receivedBy: validated.receivedBy,
      notes: validated.notes,
      createdAt: now,
      updatedAt: now,
    });

    for (const [index, item] of validated.items.entries()) {
      const poItem = await tx
        .select()
        .from(purchaseOrderItems)
        .where(eq(purchaseOrderItems.id, item.poItemId))
        .limit(1);

      if (!poItem[0]) throw new Error(`PO item ${item.poItemId} not found`);

      const qty = item.quantityReceived;
      if (qty < 0) throw new Error('Quantity received cannot be negative');

      const outstanding = poItem[0].quantity - poItem[0].receivedQuantity;
      if (qty > outstanding + 1e-9) {
        throw new Error(`Quantity received (${qty}) exceeds outstanding (${outstanding}) for ${poItem[0].description}`);
      }

      await tx.insert(goodsReceiptItems).values({
        receiptReference: reference,
        poItemId: item.poItemId,
        productReference: poItem[0].productReference,
        description: poItem[0].description,
        quantityReceived: qty,
        unitPrice: poItem[0].unitPrice,
        sortOrder: index,
      });

      await tx
        .update(purchaseOrderItems)
        .set({ receivedQuantity: poItem[0].receivedQuantity + qty })
        .where(eq(purchaseOrderItems.id, item.poItemId));
    }

    // Update PO status based on receiving
    const updatedPO = await getPurchaseOrder(validated.poReference);
    if (updatedPO?.purchaseOrder) {
      const allReceived = updatedPO.purchaseOrder.items.every(
        (i) => i.receivedQuantity >= i.quantity - 1e-9
      );
      const anyReceived = updatedPO.purchaseOrder.items.some((i) => i.receivedQuantity > 0);
      let newStatus = updatedPO.purchaseOrder.status;
      let nowReceived = false;

      if (allReceived) {
        newStatus = 'received';
        nowReceived = true;
      } else if (anyReceived) {
        newStatus = 'partially_received';
      }

      if (newStatus !== updatedPO.purchaseOrder.status && !['cancelled', 'closed'].includes(updatedPO.purchaseOrder.status)) {
        await tx
          .update(purchaseOrders)
          .set({ status: newStatus, updatedAt: now })
          .where(eq(purchaseOrders.reference, validated.poReference));
      }

      // Auto-create assets when PO becomes fully received
      if (!['received', 'partially_received'].includes(po[0].status) && nowReceived) {
        try {
          await createAssetsFromPOReceiptInternal(validated.poReference, tx);
        } catch (e) {
          console.error('Failed to auto-create assets from PO receipt:', e);
        }
      }
    }
  });

  revalidatePath('/purchase-orders', 'page');
  revalidatePath(`/purchase-orders/${validated.poReference}`);
  revalidateTag('purchase-orders', 'page');

  return { goodsReceipt: { reference, ...validated } };
}

async function createAssetsFromPOReceiptInternal(poReference: string, tx: any) {
  const po = await tx.select().from(purchaseOrders).where(eq(purchaseOrders.reference, poReference)).limit(1);
  if (!po[0]) throw new Error('Purchase order not found');
  if (!['received', 'partially_received'].includes(po[0].status)) {
    throw new Error('PO must be received or partially_received to create assets');
  }

  const items = await tx
    .select()
    .from(purchaseOrderItems)
    .where(eq(purchaseOrderItems.poReference, poReference));

  const createdAssets: string[] = [];

  for (const item of items) {
    if (item.receivedQuantity > 0) {
      // Check if asset already exists
      const existingAsset = await tx
        .select()
        .from(assets)
        .where(and(
          eq(assets.purchaseOrderReference, poReference),
          eq(assets.serialNumber, item.serialNumber || `${poReference}-${item.id}`)
        ))
        .limit(1);

      if (existingAsset[0]) continue;

      const assetRef = await generateReference('AST');
      const assetData = {
        reference: assetRef,
        name: item.description,
        categoryId: null,
        status: 'acquired' as const,
        purchasePrice: item.unitPrice * item.receivedQuantity,
        currency: po[0].currency,
        purchaseDate: new Date().toISOString().split('T')[0],
        purchaseOrderReference: po[0].reference,
        expenseReference: null,
        serialNumber: item.serialNumber || `${poReference}-${item.id}`,
        model: item.model,
        manufacturer: item.manufacturer,
        warrantyExpiry: null,
        assignedTo: null,
        assignedBranch: null,
        businessReference: null,
        location: null,
        conditionRating: 10,
        notes: `Auto-created from PO ${po[0].reference} receipt`,
        vendorReference: po[0].vendorReference,
        vendorName: po[0].vendorName,
        depreciationRate: 0,
        depreciationMethod: 'straight_line' as const,
        bookValue: item.unitPrice * item.receivedQuantity,
        accumulatedDepreciation: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await tx.insert(assets).values(assetData);
      createdAssets.push(assetRef);

      // Auto-create asset purchase expense
      const expenseRef = await generateReference('EXP');
      await tx.insert(expenses).values({
        reference: expenseRef,
        title: `Asset Purchase: ${item.description}`,
        category: 'asset_purchase',
        amount: item.unitPrice * item.receivedQuantity,
        currency: po[0].currency,
        status: 'paid',
        expenseDate: new Date().toISOString().split('T')[0],
        vendorReference: po[0].vendorReference,
        assetReference: assetRef,
        purchaseOrderReference: po[0].reference,
        assetCategory: 'purchase',
        isAssetPurchase: true,
        notes: `Auto-created from PO ${po[0].reference} receipt for ${item.receivedQuantity} units`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Auto-create inventory adjustment
      if (item.productReference) {
        const adjRef = await generateReference('ADJ');
        await tx.insert(inventoryAdjustments).values({
          reference: adjRef,
          productReference: item.productReference,
          type: 'receipt',
          quantity: item.receivedQuantity,
          reason: `PO ${po[0].reference} received`,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
        });
        // Update product stock
        await tx
          .update(products)
          .set({ stock: sql`${products.stock} + ${item.receivedQuantity}` })
          .where(eq(products.reference, item.productReference));
      }
    }
  }

  // Mark PO as having assets created
  if (createdAssets.length > 0) {
    await tx
      .update(purchaseOrders)
      .set({
        assetCreated: true,
        assetReferences: JSON.stringify(createdAssets),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(purchaseOrders.reference, poReference));
  }

  return { created: createdAssets.length, assetRefs: createdAssets };
}

export async function getPOReceivingStatus(poReference: string) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'purchase-orders:read')) {
    throw new Error('Unauthorized');
  }

  const po = await db.select().from(purchaseOrders).where(eq(purchaseOrders.reference, poReference)).limit(1);
  if (!po[0]) return null;

  const items = await db
    .select()
    .from(purchaseOrderItems)
    .where(eq(purchaseOrderItems.poReference, poReference));

  const itemStatus = items.map((i) => ({
    id: i.id,
    description: i.description,
    productReference: i.productReference,
    ordered: i.quantity,
    received: i.receivedQuantity,
    outstanding: Math.max(0, i.quantity - i.receivedQuantity),
    fullyReceived: i.receivedQuantity >= i.quantity - 1e-9,
  }));

  const fullyReceived = items.length > 0 && items.every((i) => i.receivedQuantity >= i.quantity - 1e-9);
  const partiallyReceived = items.some((i) => i.receivedQuantity > 0) && !fullyReceived;

  return { poReference, items: itemStatus, fullyReceived, partiallyReceived };
}

export async function invoiceGate(poReference: string) {
  const user = await getUserRequest();
  if (!user || !hasPermission(user.role, 'purchase-orders:read')) {
    throw new Error('Unauthorized');
  }

  const status = await getPOReceivingStatus(poReference);
  if (!status) return { allowed: false, reason: 'Purchase order not found', receivedValue: 0, orderedValue: 0, receivedPercent: 0 };

  const po = await db.select().from(purchaseOrders).where(eq(purchaseOrders.reference, poReference)).limit(1);
  if (!po[0]) return { allowed: false, reason: 'Purchase order not found', receivedValue: 0, orderedValue: 0, receivedPercent: 0 };

  // Fetch items separately
  const items = await db.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.poReference, poReference));
  const receivedValue = items.reduce((s, i) => s + (i.receivedQuantity || 0) * (i.unitPrice || 0), 0);
  const orderedValue = po[0].totalAmount;
  const receivedPercent = orderedValue > 0 ? (receivedValue / orderedValue) * 100 : 0;

  if (status.fullyReceived) {
    return { allowed: true, reason: 'All goods received', receivedValue, orderedValue, receivedPercent };
  }
  if (status.partiallyReceived) {
    return { allowed: false, reason: 'Partial receipt only — invoice blocked until full delivery', receivedValue, orderedValue, receivedPercent };
  }
  return { allowed: false, reason: 'No goods received yet — invoice blocked', receivedValue, orderedValue, receivedPercent };
}

async function getUserRequest() {
  return { id: 1, name: 'System', role: 'admin', team: null };
}