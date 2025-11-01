"use client";

import { useEffect, useRef, useState } from "react";
import { useChainId } from "wagmi";
import CurrencyInput from "react-currency-input-field";
import {
  Address,
  encodeFunctionData,
  erc20Abi,
  formatUnits,
  parseUnits,
} from "viem";
import {
  useAccount,
  useBalance,
  useCapabilities,
  useReadContract,
  useSendCalls,
  useSendTransaction,
} from "wagmi";
import { match, P } from "ts-pattern";
import {
  ENDAOMENT_ENTITY_ABI,
  ENDAOMENT_ORG_FUND_FACTORY_ABI,
  ETH_PER_CHAIN,
  ORG_FUND_FACTORY_CONTRACT_ADDRESS,
  USDC_PER_CHAIN,
  DONATION_DOLLAR_TIERS,
  SupportedChainId,
  NdaoApiOrg,
} from "@/lib/endaoment-constants";
import {
  getEthPrice,
  getSwapAndDonateInfo,
  processDonation,
} from "@/lib/endaoment-requests";
import { getOnchainOrgId, priceToEthAmount } from "@/lib/endaoment-utils";
import { useMiniKit } from "@coinbase/onchainkit/minikit";

export const DonationSwapper = ({
  org,
  onSuccess,
}: {
  org: NdaoApiOrg;
  onSuccess?: (hash: string, amount: number, chainId: number) => void;
}) => {
  const { context } = useMiniKit();
  const { address } = useAccount();
  const chainId = useChainId() as SupportedChainId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [ethPrice, setEthPrice] = useState<number>();
  const [dollarAmount, setDollarAmount] = useState<number | "">(
    DONATION_DOLLAR_TIERS[0]
  );
  const [isUSDCDonation, setIsUSDCDonation] = useState<boolean>(true);
  const [isProcessingDonation, setIsProcessingDonation] = useState(false);
  const [error, setError] = useState<string>("");

  const { data: tokenBalance } = useBalance({
    address,
    chainId,
    token: isUSDCDonation ? USDC_PER_CHAIN[chainId].address : undefined,
  });

  const { sendTransaction } = useSendTransaction();
  const { sendCallsAsync } = useSendCalls();
  const { data: walletCapabilities } = useCapabilities({
    account: address,
  });

  const supportsBatchTransactions =
    walletCapabilities?.[chainId]?.atomicBatch?.supported ?? false;

  const isEntityDeployed = org ? !!org.contractAddress : undefined;
  const targetAddress = org
    ? org.contractAddress ?? ORG_FUND_FACTORY_CONTRACT_ADDRESS
    : undefined;

  const { data: allowance } = useReadContract({
    abi: erc20Abi,
    address: USDC_PER_CHAIN[chainId].address,
    functionName: "allowance",
    args: address && targetAddress ? [address, targetAddress] : undefined,
    query: {
      enabled: !!org && !!address && isUSDCDonation,
      refetchInterval: 5_000,
    },
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    getEthPrice().then(setEthPrice);
  }, []);

  const usdcForChain = USDC_PER_CHAIN[chainId];
  const ethForChain = ETH_PER_CHAIN[chainId];

  const handleDonate = async () => {
    if (
      !org ||
      !targetAddress ||
      !tokenBalance ||
      !ethPrice ||
      !dollarAmount ||
      typeof dollarAmount !== "number"
    ) {
      setError("Invalid donation parameters");
      return;
    }

    setError("");

    const handleOnDonationComplete = async (hash: string) => {
      try {
        await processDonation({
          fid: context?.user?.fid?.toString(),
          displayName: context?.user?.displayName,
          username: context?.user?.username,
          amount: dollarAmount,
          token: isUSDCDonation ? "USDC" : "ETH",
          donorName: context?.user?.username,
          donationTransactionHash: hash,
          chainId,
        });
        setIsProcessingDonation(false);
        onSuccess?.(hash, dollarAmount, chainId);
      } catch (err) {
        console.error("Error processing donation:", err);
        setIsProcessingDonation(false);
        setError("Donation submitted but processing failed");
      }
    };

    const handleOnDonationError = (err: Error) => {
      setIsProcessingDonation(false);
      setError(err.message || "Donation failed");
    };

    setIsProcessingDonation(true);

    // USDC Donation
    if (isUSDCDonation) {
      if (allowance === undefined) {
        setIsProcessingDonation(false);
        setError("Unable to check allowance");
        return;
      }

      const amountIn = parseUnits(
        dollarAmount.toString(),
        tokenBalance.decimals
      );

      const donate = () => {
        let data = encodeFunctionData({
          abi: ENDAOMENT_ENTITY_ABI,
          functionName: "donate",
          args: [amountIn],
        });

        if (!isEntityDeployed) {
          data = encodeFunctionData({
            abi: ENDAOMENT_ORG_FUND_FACTORY_ABI,
            functionName: "deployOrgAndDonate",
            args: [getOnchainOrgId(org.ein ?? org.id), amountIn],
          });
        }

        sendTransaction(
          {
            to: targetAddress,
            data,
          },
          {
            onSuccess: handleOnDonationComplete,
            onError: (err) => handleOnDonationError(err as Error),
          }
        );
      };

      // If allowance is insufficient, we need to approve
      if (allowance < amountIn) {
        // Use batch transactions if supported
        if (supportsBatchTransactions && sendCallsAsync) {
          const approveTx = {
            to: usdcForChain.address as Address,
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: "approve",
              args: [targetAddress, amountIn],
            }),
          };

          let donateTx;
          if (!isEntityDeployed) {
            donateTx = {
              to: targetAddress as Address,
              data: encodeFunctionData({
                abi: ENDAOMENT_ORG_FUND_FACTORY_ABI,
                functionName: "deployOrgAndDonate",
                args: [getOnchainOrgId(org.ein ?? org.id), amountIn],
              }),
            };
          } else {
            donateTx = {
              to: targetAddress as Address,
              data: encodeFunctionData({
                abi: ENDAOMENT_ENTITY_ABI,
                functionName: "donate",
                args: [amountIn],
              }),
            };
          }

          sendCallsAsync({
            calls: [approveTx, donateTx],
          })
            .then((result) => handleOnDonationComplete(result.id))
            .catch((err) => handleOnDonationError(err as Error));
        } else {
          // Fallback to original flow
          const data = encodeFunctionData({
            abi: erc20Abi,
            functionName: "approve",
            args: [targetAddress, amountIn],
          });

          sendTransaction(
            {
              to: usdcForChain.address,
              data,
            },
            {
              onSuccess: () => {
                setTimeout(donate, 5_000);
              },
              onError: (err) => handleOnDonationError(err as Error),
            }
          );
        }
      } else {
        donate();
      }
    }

    // ETH Donation
    else {
      const amountIn = parseUnits(
        priceToEthAmount(dollarAmount, ethPrice).toString(),
        tokenBalance.decimals
      );

      try {
        const swapInfo = await getSwapAndDonateInfo({
          recipientEntityId: org.id,
          recipientEntityType: "org",
          inputTokenId: ethForChain.tokenId,
          chainId,
          amountIn,
        });

        let data = encodeFunctionData({
          abi: ENDAOMENT_ENTITY_ABI,
          functionName: "swapAndDonate",
          args: [
            swapInfo.swapWrapper,
            swapInfo.tokenIn,
            swapInfo.amountIn,
            swapInfo.callData,
          ],
        });

        if (!isEntityDeployed) {
          data = encodeFunctionData({
            abi: ENDAOMENT_ORG_FUND_FACTORY_ABI,
            functionName: "deployOrgSwapAndDonate",
            args: [
              getOnchainOrgId(org.ein ?? org.id),
              swapInfo.swapWrapper,
              swapInfo.tokenIn,
              swapInfo.amountIn,
              swapInfo.callData,
            ],
          });
        }

        sendTransaction(
          {
            to: targetAddress,
            value: BigInt(swapInfo.amountIn),
            data,
          },
          {
            onSuccess: handleOnDonationComplete,
            onError: (err) => handleOnDonationError(err as Error),
          }
        );
      } catch (err) {
        handleOnDonationError(err as Error);
      }
    }
  };

  const fontSize = match((dollarAmount || "").toString().length)
    .with(P.union(6, 7), () => "text-5xl")
    .with(8, () => "text-4xl")
    .otherwise(() => "text-6xl");

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: "1.5rem"
    }}>
      {error && (
        <div style={{
          background: "rgba(252, 64, 31, 0.1)",
          border: "2px solid rgba(252, 64, 31, 0.3)",
          color: "#fc401f",
          padding: "1rem",
          borderRadius: "12px",
          fontSize: "0.9rem",
          fontWeight: "500"
        }}>
          {error}
        </div>
      )}

      {/* Amount Input */}
      <div style={{
        textAlign: "center",
        padding: "1rem 0"
      }}>
        <CurrencyInput
          ref={inputRef}
          prefix="$"
          decimalScale={0}
          value={dollarAmount}
          maxLength={8}
          onValueChange={(_value, _name, values) =>
            setDollarAmount(values?.float ?? "")
          }
          className={fontSize}
          style={{
            width: "100%",
            border: "none",
            fontWeight: "700",
            color: "#0000ff",
            textAlign: "center",
            outline: "none",
            background: "transparent",
            height: "7rem"
          }}
        />
      </div>

      {/* Amount Buttons */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "0.75rem"
      }}>
        {DONATION_DOLLAR_TIERS.map((tier) => (
          <button
            key={tier}
            onClick={() => setDollarAmount(tier)}
            disabled={isProcessingDonation}
            style={{
              padding: "1rem 0.5rem",
              background: dollarAmount === tier ? "#0000ff" : "rgba(0, 0, 255, 0.1)",
              color: dollarAmount === tier ? "white" : "#0000ff",
              border: "2px solid",
              borderColor: dollarAmount === tier ? "#0000ff" : "rgba(0, 0, 255, 0.3)",
              borderRadius: "12px",
              fontWeight: "700",
              fontSize: "1.125rem",
              cursor: isProcessingDonation ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              opacity: isProcessingDonation ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (!isProcessingDonation && dollarAmount !== tier) {
                e.currentTarget.style.background = "rgba(0, 0, 255, 0.15)";
                e.currentTarget.style.borderColor = "rgba(0, 0, 255, 0.5)";
              }
            }}
            onMouseLeave={(e) => {
              if (dollarAmount !== tier) {
                e.currentTarget.style.background = "rgba(0, 0, 255, 0.1)";
                e.currentTarget.style.borderColor = "rgba(0, 0, 255, 0.3)";
              }
            }}
          >
            ${tier}
          </button>
        ))}
      </div>

      {/* Donate Button */}
      <button
        onClick={handleDonate}
        disabled={
          !org ||
          !tokenBalance ||
          !dollarAmount ||
          isProcessingDonation ||
          (!isUSDCDonation && !ethPrice) ||
          (isUSDCDonation && allowance === undefined)
        }
        style={{
          width: "100%",
          height: "3.5rem",
          background: "linear-gradient(135deg, #0000ff 0%, #3c8aff 100%)",
          color: "white",
          border: "none",
          borderRadius: "12px",
          fontWeight: "700",
          fontSize: "1.25rem",
          cursor: isProcessingDonation ? "not-allowed" : "pointer",
          transition: "all 0.3s",
          opacity: (!org || !tokenBalance || !dollarAmount || isProcessingDonation || (!isUSDCDonation && !ethPrice) || (isUSDCDonation && allowance === undefined)) ? 0.5 : 1,
          boxShadow: "0 4px 16px rgba(0, 0, 255, 0.3)",
          marginTop: "0.5rem"
        }}
        onMouseEnter={(e) => {
          if (!isProcessingDonation && org && tokenBalance && dollarAmount) {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(0, 0, 255, 0.4)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(0, 0, 255, 0.3)";
        }}
      >
        {isProcessingDonation ? "Processing..." : "💙 Donate Now"}
      </button>

      {/* Divider */}
      <div style={{
        height: "1px",
        background: "linear-gradient(90deg, transparent, #dee1e7, transparent)",
        margin: "0.5rem 0"
      }} />

      {/* Balance & Switch Token */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "1rem"
      }}>
        {tokenBalance && ethPrice ? (
          <div style={{
            fontSize: "0.875rem",
            color: "#5b616e",
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem"
          }}>
            <span style={{ fontWeight: "600", color: "#32353d" }}>
              {isUSDCDonation ? (
                <span>
                  $
                  {(+formatUnits(
                    tokenBalance.value,
                    tokenBalance.decimals
                  )).toFixed(2)}{" "}
                  <span style={{ color: "#0000ff" }}>USDC</span>
                </span>
              ) : (
                <span>
                  $
                  {(
                    +formatUnits(tokenBalance.value, tokenBalance.decimals) *
                    ethPrice
                  ).toFixed(2)}{" "}
                  <span style={{ color: "#0000ff" }}>
                    ({(+formatUnits(
                      tokenBalance.value,
                      tokenBalance.decimals
                    )).toFixed(5)} ETH)
                  </span>
                </span>
              )}
            </span>
            <span style={{ fontSize: "0.75rem", color: "#717886" }}>Your Balance</span>
          </div>
        ) : (
          <div style={{
            fontSize: "0.875rem",
            color: "#717886"
          }}>
            Loading balance...
          </div>
        )}
        <button
          onClick={() => setIsUSDCDonation(!isUSDCDonation)}
          style={{
            padding: "0.625rem 1.25rem",
            background: "rgba(0, 0, 255, 0.1)",
            color: "#0000ff",
            border: "1px solid rgba(0, 0, 255, 0.3)",
            borderRadius: "8px",
            fontWeight: "600",
            fontSize: "0.875rem",
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0, 0, 255, 0.15)";
            e.currentTarget.style.borderColor = "rgba(0, 0, 255, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0, 0, 255, 0.1)";
            e.currentTarget.style.borderColor = "rgba(0, 0, 255, 0.3)";
          }}
        >
          Switch to {isUSDCDonation ? "ETH" : "USDC"}
        </button>
      </div>
    </div>
  );
};
