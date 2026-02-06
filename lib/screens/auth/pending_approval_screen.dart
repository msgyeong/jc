import 'package:flutter/material.dart';

import '../../theme/app_theme.dart';

/// 승인 진행중 화면
/// 회원가입 완료 후 "회원 가입이 승인 진행중입니다" 메시지 표시
class PendingApprovalScreen extends StatelessWidget {
  const PendingApprovalScreen({
    super.key,
    this.onConfirm,
  });

  /// '확인' 버튼 클릭 시 호출 (로그인 화면으로 복귀)
  final VoidCallback? onConfirm;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('회원가입 완료'),
        backgroundColor: AppTheme.primaryColor,
        foregroundColor: Colors.white,
        automaticallyImplyLeading: false,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Icon(
                Icons.check_circle_outline,
                size: 120,
                color: AppTheme.primaryColor,
              ),
              const SizedBox(height: 32),
              Text(
                '회원 가입이\n승인 진행중입니다',
                style: Theme.of(context).textTheme.displayLarge?.copyWith(
                      height: 1.4,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              Text(
                '관리자의 승인이 완료되면\n로그인하실 수 있습니다.',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      color: AppTheme.textSecondary,
                      height: 1.6,
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 48),
              SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: onConfirm,
                  child: const Text('확인'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
