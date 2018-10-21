package com.capco.spa.aop;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

import com.capco.spa.utils.OutputUtils;

import lombok.extern.slf4j.Slf4j;

@Aspect
@Component
@Slf4j
public class LoggableAspect {

    @Around("@annotation(com.capco.spa.aop.Loggable) && execution(public * *(..))")
    public Object logMethod(final ProceedingJoinPoint proceedingJoinPoint) throws Throwable {

        final MethodSignature signature = (MethodSignature) proceedingJoinPoint.getSignature();
        final String[] parameterNames = signature.getParameterNames();
        Object[] args = proceedingJoinPoint.getArgs();

        StringBuilder stringBuilder = new StringBuilder(  );
        if (parameterNames!=null) {
            for ( int i = 0; i < parameterNames.length; i++ ) {
                String parameterName = parameterNames[i];
                Object parameterValue = args[i];

                stringBuilder.append( parameterName + ":\n" );
                if (parameterValue instanceof double[]) {
                    stringBuilder.append( OutputUtils.vectorToString( (double[]) parameterValue ) );
                } else if (parameterValue instanceof double[][]) {
                    stringBuilder.append( OutputUtils.matrixToString( (double[][]) parameterValue ) );
                } else {
                    stringBuilder.append( parameterValue );
                }
                stringBuilder.append( "\n\n" );

            }
        }

        log.debug("{}.{} with args \n {}",
                proceedingJoinPoint.getSignature().getDeclaringType().getSimpleName(),
                proceedingJoinPoint.getSignature().getName(),
                stringBuilder);

        Object value;

        try {
            value = proceedingJoinPoint.proceed();
        } catch (Throwable throwable) {
            throw throwable;
        }

        return value;
    }
}
