import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CartItemDto } from './dto/cartItem.dto';

@Injectable()
export class CartService {
  constructor(private readonly prismaService: PrismaService) {}

  createNewCart(userId) {
    const createNewCart = this.prismaService.cart.create({
      data: {
        ...userId,
      },
    });

    return createNewCart;
  }

  async addProducttoCart(product, productId: string, req) {
    const user = req.user as {
      id: string;
      email: string;
      name: string;
    };

    const cart = await this.prismaService.cart.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (!cart) {
      throw new ForbiddenException('Cart not found');
    }

    const itIsAlreadyIn = await this.prismaService.cart.findFirst({
      where: {
        userId: user.id,
        items: {
          some: {
            productId,
          },
        },
      },
    });

    if (itIsAlreadyIn) {
      throw new ForbiddenException('Product already in cart');
    }

    const productToCheck = await this.prismaService.product.findFirst({
      where: {
        id: productId,
      },
    });

    if (product.quantity > productToCheck.quantity) {
      throw new ForbiddenException('Product quantity is not enough');
    }

    await this.prismaService.cartItem.create({
      data: {
        ...product,
        productId,
        cartId: cart.id,
      },
    });

    return cart;
  }

  async getAllCartItems(req) {
    const user = req.user as {
      id: string;
      email: string;
      role: string;
    };

    const cart = await this.prismaService.cart.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (!cart) {
      throw new ForbiddenException('Cart not found');
    }

    return this.prismaService.cartItem.findMany({
      where: {
        cartId: cart.id,
      },
    });
  }

  async updateCartItem(cartItem: CartItemDto, cartItemId: string, req) {
    const user = req.user as {
      id: string;
      email: string;
      role: string;
    };

    const cart = await this.prismaService.cart.findFirst({
      where: {
        userId: user.id,
        items: {
          some: {
            id: cartItemId,
          },
        },
      },
    });

    if (!cart) {
      throw new ForbiddenException('CartItem not found');
    }

    const product = await this.prismaService.product.findFirst({
      where: {
        cartItems: {
          some: {
            id: cartItemId,
          },
        },
      },
    });

    if (product.quantity < cartItem.quantity) {
      throw new ForbiddenException('Product quantity is not enough');
    }

    const newCartItem = await this.prismaService.cartItem.update({
      where: {
        id: cartItemId,
      },
      data: {
        ...cartItem,
      },
    });

    return newCartItem;
  }

  async deleteCartItem(cartItem, req) {}
}