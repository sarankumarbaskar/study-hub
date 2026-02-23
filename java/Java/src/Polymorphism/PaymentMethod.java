package Polymorphism;

import java.io.IOException;
import java.util.List;

public interface PaymentMethod {
    default double calculateFee(String paymentType, double amount) throws IOException {
        throw new IOException("Something");

    }

    public static void main(String[] args) {
        PaymentMethod paymentMethod = new CreditCard() ;
        try {
            paymentMethod.calculateFee("CreditCard", 10);

            List<Integer> alice = List.of(2, 1);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

}

class CreditCard implements PaymentMethod {
    public double calculateFee(double amount) {
        return amount * 0.029;
    }
}

class BankTransfer implements PaymentMethod {
    public double calculateFee(double amount) {
        return 1.50;
    }
}

class Crypto implements PaymentMethod {
    public double calculateFee(double amount) {
        return amount * 0.01;
    }
}
