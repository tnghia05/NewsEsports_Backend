import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { OrderModelName } from '../models/order.model';
import { ProductModelName } from '../models/product.model';
import { ProductVariantModelName } from '../models/product-variant.model';
import { OrderReservationsService } from './order-reservations.service';

function chainExec<T>(value: T) {
  return {
    exec: async () => value,
  };
}

describe('OrderReservationsService', () => {
  it('releases reserved qty once (CAS) for cancelled orders', async () => {
    const orderId = '64b0b0b0b0b0b0b0b0b0b0b0';
    const order = {
      _id: orderId,
      orderCode: 'ODTEST-1',
      items: [{ productId: 'p1', qty: 2 }],
      status: 'cancelled',
    };

    const findById = jest.fn().mockReturnValue(chainExec(order));

    let updateOneCalls = 0;
    const updateOne = jest.fn().mockImplementation(() => {
      updateOneCalls += 1;
      return chainExec({ modifiedCount: updateOneCalls === 1 ? 1 : 0 });
    });

    const productUpdateOne = jest.fn().mockReturnValue(chainExec({ modifiedCount: 1 }));
    const variantUpdateOne = jest.fn().mockReturnValue(chainExec({ modifiedCount: 1 }));

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrderReservationsService,
        { provide: getModelToken(OrderModelName), useValue: { findById, updateOne } },
        { provide: getModelToken(ProductModelName), useValue: { updateOne: productUpdateOne } },
        { provide: getModelToken(ProductVariantModelName), useValue: { updateOne: variantUpdateOne } },
      ],
    }).compile();

    const svc = moduleRef.get(OrderReservationsService);

    await svc.releasePendingReservationIfNeeded(orderId);
    await svc.releasePendingReservationIfNeeded(orderId);

    expect(updateOne).toHaveBeenCalled();
    expect(productUpdateOne).toHaveBeenCalledTimes(1);
    expect(variantUpdateOne).not.toHaveBeenCalled();
  });
});
